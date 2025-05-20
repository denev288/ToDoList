import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import FriendRequestModal from '../FriendRequestModal';


jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../config", () => ({
    VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));
  

describe('FriendRequestModal', () => {
    const mockOnClose = jest.fn();
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose
    };
    
    const mockUser = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('renders modal when isOpen is true', () => {
        render(<FriendRequestModal {...defaultProps} />);
        expect(screen.getByText('Find Friends')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
        render(<FriendRequestModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Find Friends')).not.toBeInTheDocument();
    });

    it('allows searching for users by email', async () => {
        const mockSearchResult = [{
            _id: '123',
            name: 'Test User',
            email: 'test@example.com'
        }];

        mockedAxios.post.mockResolvedValueOnce({ data: mockSearchResult });
        
        render(<FriendRequestModal {...defaultProps} />);
        
        const searchInput = screen.getByPlaceholderText('Search by email');
        const searchButton = screen.getByText('Search');

        fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
        fireEvent.click(searchButton);

        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/search'),
            { email: 'test@example.com' },
            expect.any(Object)
        );
    });

    it('handles search errors appropriately', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: {
                data: { message: 'User not found' }
            }
        });

        render(<FriendRequestModal {...defaultProps} />);
        
        const searchInput = screen.getByPlaceholderText('Search by email');
        const searchButton = screen.getByText('Search');

        fireEvent.change(searchInput, { target: { value: 'nonexistent@example.com' } });
        fireEvent.click(searchButton);

        // Wait for error message to appear
        expect(await screen.findByText('User not found')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<FriendRequestModal {...defaultProps} />);
        
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles token refresh during search', async () => {
        mockedAxios.post.mockRejectedValueOnce({
            response: { status: 401 }
        }).mockResolvedValueOnce({
            data: { token: 'new-token' }
        }).mockResolvedValueOnce({
            data: [{ _id: '123', name: 'Test User', email: 'test@example.com' }]
        });

        render(<FriendRequestModal {...defaultProps} />);
        
        const searchInput = screen.getByPlaceholderText('Search by email');
        const searchButton = screen.getByText('Search');

        fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/refresh'),
                { refreshToken: mockUser.refreshToken }
            );
        });

        expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('sends friend request successfully', async () => {
        const mockSearchResult = [{
            _id: '123',
            name: 'Test User',
            email: 'test@example.com'
        }];

        mockedAxios.post
            .mockResolvedValueOnce({ data: mockSearchResult })  // Search response
            .mockResolvedValueOnce({ data: { message: 'Friend request sent' } }); // Friend request response

        render(<FriendRequestModal {...defaultProps} />);
        
        // Search for user
        const searchInput = screen.getByPlaceholderText('Search by email');
        const searchButton = screen.getByText('Search');
        fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
        fireEvent.click(searchButton);

        // Wait for search results and click send request
        await waitFor(() => {
            const sendRequestButton = screen.getByText('Send Request');
            fireEvent.click(sendRequestButton);
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/friends/request'),
            { _id: '123' },
            expect.any(Object)
        );
        expect(window.alert).toHaveBeenCalledWith('Friend request sent successfully!');
    });

    it('handles token refresh during friend request sending', async () => {
        const mockSearchResult = [{
            _id: '123',
            name: 'Test User',
            email: 'test@example.com'
        }];

        mockedAxios.post
            .mockResolvedValueOnce({ data: mockSearchResult })  // Search response
            .mockRejectedValueOnce({ response: { status: 401 } }) // First friend request attempt
            .mockResolvedValueOnce({ data: { token: 'new-token' } }) // Token refresh
            .mockResolvedValueOnce({ data: { message: 'Friend request sent' } }); // Second friend request attempt

        render(<FriendRequestModal {...defaultProps} />);
        
        // Search for user
        const searchInput = screen.getByPlaceholderText('Search by email');
        const searchButton = screen.getByText('Search');
        fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
        fireEvent.click(searchButton);

        // Wait for search results and click send request
        await waitFor(() => {
            const sendRequestButton = screen.getByText('Send Request');
            fireEvent.click(sendRequestButton);
        });

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/refresh'),
                { refreshToken: mockUser.refreshToken }
            );
        });

        expect(window.alert).toHaveBeenCalledWith('Friend request sent successfully!');
    });
});
