const faunadb = require('faunadb'), q = faunadb.query

export default (options = {}) => {
    if (!options.secret) {
        throw new Error('Faunadb secret key is mandatory')
    }
    const faunaClient = new faunadb.Client({ secret: options.secret })

    const getTotal = async (index) => {
        const total = await faunaClient.query(
            q.Count(
                q.Match(
                  q.Index(index)
                )
            )
          )
        return total
    }
    return {
        getList: (resource, params) => {
            // const { page, perPage } = params.pagination;
            // const { field, order } = params.sort;
            // const query = {
            //     sort: JSON.stringify([field, order]),
            //     range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            //     filter: JSON.stringify(params.filter),
            // };
            // const url = `${apiUrl}/${resource}?${stringify(query)}`;

            // return httpClient(url).then(({ headers, json }) => ({
            //     data: json,
            //     total: parseInt(headers.get('content-range').split('/').pop(), 10),
            // }));

            return new Promise( async (resolve, reject) => {
                try {
                    const index = `all_${resource}`
                    const total = await getTotal(index)
                    const dbs = await faunaClient.query(
                        q.Map(
                        q.Paginate(
                            q.Match(
                            q.Index(index)
                            )
                        ),
                        ref => q.Get(ref)
                        )
                    )
                    return resolve({
                        "data": dbs.data,
                        total
                    })
                } catch (error) {
                    return reject(error)
                }
            })
        },

        getOne: (resource, params) =>
            httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
                data: json,
            })),

        getMany: (resource, params) => {
            const query = {
                filter: JSON.stringify({ id: params.ids }),
            };
            const url = `${apiUrl}/${resource}?${stringify(query)}`;
            return httpClient(url).then(({ json }) => ({ data: json }));
        },

        getManyReference: (resource, params) => {
            const { page, perPage } = params.pagination;
            const { field, order } = params.sort;
            const query = {
                sort: JSON.stringify([field, order]),
                range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
                filter: JSON.stringify({
                    ...params.filter,
                    [params.target]: params.id,
                }),
            };
            const url = `${apiUrl}/${resource}?${stringify(query)}`;

            return httpClient(url).then(({ headers, json }) => ({
                data: json,
                total: parseInt(headers.get('content-range').split('/').pop(), 10),
            }));
        },

        update: (resource, params) =>
            httpClient(`${apiUrl}/${resource}/${params.id}`, {
                method: 'PUT',
                body: JSON.stringify(params.data),
            }).then(({ json }) => ({ data: json })),

        updateMany: (resource, params) => {
            const query = {
                filter: JSON.stringify({ id: params.ids}),
            };
            return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
                method: 'PUT',
                body: JSON.stringify(params.data),
            }).then(({ json }) => ({ data: json }));
        },

        create: (resource, params) =>
            httpClient(`${apiUrl}/${resource}`, {
                method: 'POST',
                body: JSON.stringify(params.data),
            }).then(({ json }) => ({
                data: { ...params.data, id: json.id },
            })),

        delete: (resource, params) =>
            httpClient(`${apiUrl}/${resource}/${params.id}`, {
                method: 'DELETE',
            }).then(({ json }) => ({ data: json })),

        deleteMany: (resource, params) => {
            const query = {
                filter: JSON.stringify({ id: params.ids}),
            };
            return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
                method: 'DELETE',
                body: JSON.stringify(params.data),
            }).then(({ json }) => ({ data: json }));
        },
    }
};