module.exports = async (req, res) => {
    const {
        query: { id },
        method
    } = req;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (method === 'GET') {
        res.status(200).end(
            JSON.stringify({
                id,
                message: 'Feedback endpoint is wired up. Replace this response with your own implementation.'
            })
        );
        return;
    }

    res.setHeader('Allow', 'GET');
    res.status(405).end(
        JSON.stringify({
            error: 'method_not_allowed',
            allowed: ['GET']
        })
    );
};
