const parseDate = (value) => {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const pickDefined = (source = {}, mapping = {}) => {
    const result = {};
    Object.entries(mapping).forEach(([targetKey, sourceKey]) => {
        const key = sourceKey ?? targetKey;
        const raw = source[key] ?? source[targetKey];
        if (raw !== undefined) {
            result[targetKey] = raw;
        }
    });
    return result;
};

const resolvePayloadSection = (body, sectionKey) => {
    if (body[sectionKey] && typeof body[sectionKey] === 'object') {
        return body[sectionKey];
    }
    return body;
};

module.exports = {
    parseDate,
    pickDefined,
    resolvePayloadSection
};
