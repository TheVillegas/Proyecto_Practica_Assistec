const mockPrismaClient = {
    coliFormulario: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
    },
    sauFormulario: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
    },
    salFormulario: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn()
    },
    $transaction: jest.fn((cb) => cb(mockPrismaClient))
};

module.exports = mockPrismaClient;
