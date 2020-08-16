module.exports = {
    response: (data) => ({
        success: true,
        data,
    }),

    screen: (title, blocks = [], data = {}) => ({
        title,
        blocks,
        ...data,
    }),

    listItem: (title, description = undefined, logo = {}, data = {}) => ({
        type: 'screen',
        title,
        description,
        logo,
        ...data,
    }),

    text: (text, data = {}) => ({
        type: 'text',
        text,
        ...data,
    }),

    image: (url, data = {}) => ({
        type: 'image',
        downloadUrl: url,
        ...data,
    }),

    button: (title, onClick = null, data = {}) => ({
        type: 'button',
        title,
        onClick,
        ...data,
    }),

    imageIcon: (url) => ({
        image: url,
        shape: 'circle',
    }),
}
