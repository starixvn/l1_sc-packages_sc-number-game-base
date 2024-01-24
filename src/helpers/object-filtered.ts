export const getFilterObjectWithAllowedKeys = (object: Record<string, any>, allowedKeys: string[]) => {
    const entries = Object.entries(object);

    const filteredEntries = entries.filter(([key]) => allowedKeys.includes(key));

    const filteredObject = Object.fromEntries(filteredEntries);

    return filteredObject;
};
