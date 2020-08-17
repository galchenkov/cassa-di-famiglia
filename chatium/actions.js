module.exports = {
    navigate: (url) => ({
        type: 'navigate',
        url,
    }),

    apiCall: (url, apiParams = {}, confirm = false) => ({
        type: 'apiCall',
        url,
        apiParams,
        confirm,
    }),

    showToast: (toast) => ({
        type: 'showToast',
        toast,
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
