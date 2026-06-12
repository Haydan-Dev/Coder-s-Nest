export const parseApiError = (error) => {
    if (error.response?.data?.detail) {
        const detail = error.response.data.detail
        if (typeof detail === 'string') {
            return detail;
        }
        if (Array.isArray(detail)) {
            return detail.map(err =>
                err.msg).join(',');
        }
    }
    return "Something went wrong";
}