import Swal from 'sweetalert2';

export const alertService = {
    // 1. Success wrapper
    success: (message) => {
        return Swal.fire({
            icon: 'success',
            title: 'success',
            text: message,
        });
    },

    // 2. Error wrapper
    error: (message, title = 'Opps...') => {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: message,
        });
    },

    // 3. Form validation wrapper
    validationError: (message) => {
        return Swal.fire({
            title: 'Validation Error!',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
        });
    }
};
