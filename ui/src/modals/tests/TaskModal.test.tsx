import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskModal from '../TaskModal';

describe('TaskModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        onSubmit: mockOnSubmit,
        title: '',
        description: '',
        modalTitle: 'Test Modal',
        error: null
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('prevents submission with empty title', () => {
        render(<TaskModal {...defaultProps} />);
        
        const submitButton = screen.getByRole('button', { name: /add/i });
        fireEvent.click(submitButton);

        expect(window.alert).toHaveBeenCalledWith('Task title cannot be empty');
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('closes modal on Escape key', () => {
        render(<TaskModal {...defaultProps} />);
        
        fireEvent.keyDown(screen.getByRole('textbox', { name: /title/i }), { 
            key: 'Escape',
            code: 'Escape'
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('submits form on Enter key without shift', () => {
        render(<TaskModal {...defaultProps} />);
        
        const titleInput = screen.getByRole('textbox', { name: /title/i });
        fireEvent.change(titleInput, { target: { value: 'Test Task' } });
        
        fireEvent.keyDown(titleInput, { 
            key: 'Enter',
            code: 'Enter',
            shiftKey: false
        });

        expect(mockOnSubmit).toHaveBeenCalledWith('Test Task', '');
    });

    it('does not submit form on Enter key with shift', () => {
        render(<TaskModal {...defaultProps} />);
        
        const titleInput = screen.getByRole('textbox', { name: /title/i });
        fireEvent.change(titleInput, { target: { value: 'Test Task' } });
        
        fireEvent.keyDown(titleInput, { 
            key: 'Enter',
            code: 'Enter',
            shiftKey: true
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });
});
