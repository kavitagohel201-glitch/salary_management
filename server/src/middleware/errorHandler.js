const { Prisma } = require('@prisma/client');

function errorHandler(error, _req, res, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'An employee with this email already exists.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found.' });
    }
  }

  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error('Unhandled request error:', error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
}

module.exports = { errorHandler };
