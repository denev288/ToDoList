import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import FriendsListModal from '../FriendsListModal';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../config", () => ({
    VITE_APIURL: "https://todolist-jr6y.onrender.com",
}));

describe('FriendsListModal', () => {
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
    });

    it('renders modal when isOpen is true', () => {
        render(<FriendsListModal {...defaultProps} />);
        expect(screen.getByText('Friends List')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
        render(<FriendsListModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Friends List')).not.toBeInTheDocument();
    });

    it('fetches and displays friends list', async () => {
        const mockFriends = [
            { userId: '1', email: 'friend1@example.com' },
            { userId: '2', email: 'friend2@example.com' }
        ];

        mockedAxios.get.mockResolvedValueOnce({ 
            data: { friendsList: mockFriends } 
        });

        render(<FriendsListModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('friend1@example.com')).toBeInTheDocument();
            expect(screen.getByText('friend2@example.com')).toBeInTheDocument();
        });
    });

    it('handles fetch error correctly', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: 500 }
        });

        render(<FriendsListModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch friends list')).toBeInTheDocument();
        });
    });

    it('handles token refresh when fetching friends', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: 401 }
        });
        
        mockedAxios.post.mockResolvedValueOnce({
            data: { token: 'new-token' }
        });

        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: [{ userId: '1', email: 'friend@example.com' }] }
        });

        render(<FriendsListModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('friend@example.com')).toBeInTheDocument();
        });
    });

    it('handles unfollow friend action', async () => {
        // Setup initial friends list
        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: [{ userId: '1', email: 'friend@example.com' }] }
        });

        // Setup successful unfollow response
        mockedAxios.delete.mockResolvedValueOnce({ data: { message: 'Success' } });

        render(<FriendsListModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('friend@example.com')).toBeInTheDocument();
        });

        const unfollowButton = screen.getByText('Unfollow');
        fireEvent.click(unfollowButton);

        await waitFor(() => {
            expect(screen.queryByText('friend@example.com')).not.toBeInTheDocument();
        });
    });

    it('handles unfollow error with token refresh', async () => {
        // Setup initial friends list
        mockedAxios.get.mockResolvedValueOnce({
            data: { friendsList: [{ userId: '1', email: 'friend@example.com' }] }
        });

        // Setup 401 error and token refresh flow
        mockedAxios.delete.mockRejectedValueOnce({
            response: { status: 401 }
        });
        
        mockedAxios.post.mockResolvedValueOnce({
            data: { token: 'new-token' }
        });

        mockedAxios.delete.mockResolvedValueOnce({
            data: { message: 'Success' }
        });

        render(<FriendsListModal {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('friend@example.com')).toBeInTheDocument();
        });

        const unfollowButton = screen.getByText('Unfollow');
        fireEvent.click(unfollowButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/refresh'),
                { refreshToken: mockUser.refreshToken }
            );
        });
    });
});
