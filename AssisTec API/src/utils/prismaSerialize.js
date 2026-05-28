/**
 * Serializa registros Prisma para respuestas JSON (BigInt, Decimal, Date).
 */
function serializePrismaRecord(record) {
    if (record === null || record === undefined) {
        return record;
    }

    return JSON.parse(JSON.stringify(record, (_key, value) => {
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (value !== null && typeof value === 'object' && typeof value.toNumber === 'function') {
            return value.toNumber();
        }
        return value;
    }));
}

module.exports = { serializePrismaRecord };
