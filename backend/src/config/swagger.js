import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Farm Marketplace API',
      version: '2.0.0',
      description: 'Comprehensive API for Farm Marketplace platform',
      contact: {
        name: 'API Support',
        email: 'api@fermamarket.ru',
        url: 'https://fermamarket.ru/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.fermamarket.ru/api/v1'
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['customer', 'farmer', 'admin'] },
            avatar: { type: 'string' },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            farmer: { $ref: '#/components/schemas/Farmer' },
            category: { $ref: '#/components/schemas/Category' },
            price: {
              type: 'object',
              properties: {
                amount: { type: 'number' },
                unit: { type: 'string' }
              }
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  alt: { type: 'string' },
                  isPrimary: { type: 'boolean' }
                }
              }
            },
            availability: {
              type: 'object',
              properties: {
                inStock: { type: 'boolean' },
                quantity: { type: 'number' }
              }
            },
            rating: {
              type: 'object',
              properties: {
                average: { type: 'number' },
                count: { type: 'number' }
              }
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };