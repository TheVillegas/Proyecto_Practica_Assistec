const { z } = require('zod');

const isoDate = () => z.string().datetime({ message: 'Debe ser fecha ISO-8601 valida' });

const baseSchema = z.object({
    updated_at: isoDate(),
    completada: z.boolean()
});

module.exports = baseSchema;
module.exports.isoDate = isoDate;
