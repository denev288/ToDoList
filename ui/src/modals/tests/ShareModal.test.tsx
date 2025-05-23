import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import ShareModal from '../ShareModal';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../config", () => ({
    VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

describe('ShareModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        onSubmit: mockOnSubmit,
        error: '',
        currentUserEmail: 'current@example.com'
    };

    const mockUser = {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        // Add alert mock
        jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('renders modal when isOpen is true', () => {
        render(<ShareModal {...defaultProps} />);
        expect(screen.getByText('Share Task')).toBeInTheDocument();
    });

    it('fetches and displays friends list on open', async () => {
        const mockFriends = [
            { userId: '1', email: 'friend1@example.com' },
            { userId: '2', email: 'friend2@example.com' }
        ];

        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: mockFriends }
        });

        render(<ShareModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('friend1@example.com')).toBeInTheDocument();
            expect(screen.getByText('friend2@example.com')).toBeInTheDocument();
        });
    });

    it('handles token refresh during friend list fetch', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: 401 }
        });

        mockedAxios.post.mockResolvedValueOnce({
            data: { token: 'new-token' }
        });

        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: [{ userId: '1', email: 'friend@example.com' }] }
        });

        render(<ShareModal {...defaultProps} />);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/refresh'),
                { refreshToken: mockUser.refreshToken }
            );
            expect(screen.getByText('friend@example.com')).toBeInTheDocument();
        });
    });

    it('prevents sharing with self', async () => {
        const mockFriends = [{ userId: '1', email: 'current@example.com' }];
        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: mockFriends }
        });

        render(<ShareModal {...defaultProps} />);
        
        // Wait for friends list to load first
        await waitFor(() => {
            expect(screen.getByText('current@example.com')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'current@example.com' } });

        const shareButton = screen.getByText('Share');
        fireEvent.click(shareButton);

        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Cannot share task with yourself');
    });

    it('submits share request with valid friend and message', async () => {
        const mockFriends = [{ userId: '1', email: 'friend@example.com' }];
        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: mockFriends }
        });

        render(<ShareModal {...defaultProps} />);
        
        // Wait for friends list to load and update select
        await waitFor(() => {
            expect(screen.getByText('friend@example.com')).toBeInTheDocument();
        });

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'friend@example.com' } });

        const messageInput = screen.getByPlaceholderText('Message (optional)');
        fireEvent.change(messageInput, { target: { value: 'Test message' } });

        // Fire click event and wait for submit
        const shareButton = screen.getByText('Share');
        fireEvent.click(shareButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith('friend@example.com', 'Test message');
        });
    });

    it('displays error message when provided', () => {
        const error = 'Test error message';
        render(<ShareModal {...defaultProps} error={error} />);
        expect(screen.getByText(error)).toBeInTheDocument();
    });
});
