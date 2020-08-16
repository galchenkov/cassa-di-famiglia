module.exports = {
    showToast: (toast) => ({
        type: 'showToast',
        toast,
    }),

    navigate: (url) => ({
        type: 'navigate',
        url,
    }),

    copyToClipboard: (text) => ({
        type: 'copyToClipboard',
        text,
    }),

    goBack: () => ({
        type: 'goBack',
    }),

    refresh: () => ({
        type: 'refresh',
    }),
}
