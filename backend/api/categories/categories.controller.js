// Ruta: finanzas-app-pro/backend/api/categories/categories.controller.js
// ARCHIVO NUEVO
const db = require('../../models');
const Category = db.Category;
const { Op } = require('sequelize'); // Para operadores como OR

// Categorías globales/por defecto (ejemplos)
// En una aplicación real, podrías tener una forma de sembrar estas en la BD
// o un panel de administración para gestionarlas.
const defaultCategories = {
  ingreso: [
    { name: 'Sueldo', icon: '💰', type: 'ingreso', userId: null }, // userId null para globales
    { name: 'Ventas', icon: '🛍️', type: 'ingreso', userId: null },
    { name: 'Intereses', icon: '📈', type: 'ingreso', userId: null },
    { name: 'Regalos', icon: '🎁', type: 'ingreso', userId: null },
    { name: 'Otros Ingresos', icon: '➕', type: 'ingreso', userId: null },
  ],
  egreso: [
    { name: 'Comida', icon: '🍔', type: 'egreso', userId: null },
    { name: 'Supermercado', icon: '🛒', type: 'egreso', userId: null },
    { name: 'Transporte', icon: '🚌', type: 'egreso', userId: null },
    { name: 'Servicios', icon: '💡', type: 'egreso', userId: null },
    { name: 'Alquiler/Hipoteca', icon: '🏠', type: 'egreso', userId: null },
    { name: 'Ocio', icon: '🎬', type: 'egreso', userId: null },
    { name: 'Salud', icon: '⚕️', type: 'egreso', userId: null },
    { name: 'Educación', icon: '📚', type: 'egreso', userId: null },
    { name: 'Ropa', icon: '👕', type: 'egreso', userId: null },
    { name: 'Kiosco/Varios', icon: '🍬', type: 'egreso', userId: null },
    { name: 'Impuestos', icon: '🧾', type: 'egreso', userId: null},
    { name: 'Otros Gastos', icon: '💸', type: 'egreso', userId: null },
  ],
};

// Sembrar categorías por defecto si no existen (ejecutar una vez o bajo demanda)
// Esta función es un ejemplo, podrías llamarla al iniciar el servidor o desde un script separado.
const seedDefaultCategories = async () => {
  try {
    for (const type in defaultCategories) {
      for (const cat of defaultCategories[type]) {
        await Category.findOrCreate({
          where: { name: cat.name, type: cat.type, userId: null }, // userId null para globales
          defaults: cat,
        });
      }
    }
    console.log('Categorías por defecto sembradas/verificadas.');
  } catch (error) {
    console.error('Error sembrando categorías por defecto:', error);
  }
};
// Podrías llamar a seedDefaultCategories() aquí si quieres que se ejecute al cargar el controlador,
// o mejor aún, desde server.js después de la sincronización de la BD.

// @desc    Obtener todas las categorías (globales + del usuario)
// @route   GET /api/categories?type=ingreso o ?type=egreso
// @access  Private
const getCategories = async (req, res, next) => {
  const userId = req.user.id;
  const typeFilter = req.query.type; // 'ingreso', 'egreso', o undefined para todas

  try {
    const whereClause = {
      [Op.or]: [
        { userId: null }, // Categorías globales
        { userId: userId }  // Categorías del usuario específico
      ]
    };

    if (typeFilter && (typeFilter === 'ingreso' || typeFilter === 'egreso')) {
      whereClause.type = typeFilter;
    }

    const categories = await Category.findAll({
      where: whereClause,
      order: [
        ['type', 'ASC'], // Ordenar por tipo
        ['name', 'ASC']  // Luego por nombre
      ]
    });

    // Separar en ingresos y egresos para el frontend si no se filtró por tipo
    if (!typeFilter) {
        const result = {
            ingreso: categories.filter(c => c.type === 'ingreso'),
            egreso: categories.filter(c => c.type === 'egreso')
        }
        res.status(200).json(result);
    } else {
        res.status(200).json(categories);
    }

  } catch (error) {
    console.error('Error en getCategories:', error);
    next(error);
  }
};

// @desc    Crear una nueva categoría personalizada para el usuario
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res, next) => {
  const { name, type, icon } = req.body;
  const userId = req.user.id;

  if (!name || !type) {
    return res.status(400).json({ message: 'Nombre y tipo son requeridos para la categoría.' });
  }
  if (type !== 'ingreso' && type !== 'egreso') {
    return res.status(400).json({ message: 'El tipo debe ser "ingreso" o "egreso".' });
  }

  try {
    // Verificar si ya existe una categoría global o personalizada con el mismo nombre y tipo para este usuario
    const existingCategory = await Category.findOne({
      where: {
        name,
        type,
        [Op.or]: [
          { userId: null },
          { userId: userId }
        ]
      }
    });

    if (existingCategory) {
      if (existingCategory.userId === null) {
        return res.status(400).json({ message: `Ya existe una categoría global con el nombre "${name}" y tipo "${type}".` });
      } else {
        return res.status(400).json({ message: `Ya tienes una categoría personalizada con el nombre "${name}" y tipo "${type}".` });
      }
    }

    const newCategory = await Category.create({
      name,
      type,
      icon: icon || (type === 'ingreso' ? '➕' : '💸'), // Icono por defecto si no se provee
      userId: userId // Asociar con el usuario
    });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error en createCategory:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: `Ya tienes una categoría personalizada con el nombre "${name}" y tipo "${type}".` });
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Actualizar una categoría personalizada del usuario
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res, next) => {
  const { name, icon } = req.body; // El tipo de categoría no se debería cambiar
  const categoryId = req.params.id;
  const userId = req.user.id;

  try {
    const category = await Category.findOne({
      where: { id: categoryId, userId: userId } // Solo puede editar sus propias categorías
    });

    if (!category) {
      return res.status(404).json({ message: 'Categoría personalizada no encontrada o no te pertenece.' });
    }

    // Verificar si el nuevo nombre ya existe (excluyendo la actual)
    if (name && name !== category.name) {
        const existingCategoryWithNewName = await Category.findOne({
            where: {
                name,
                type: category.type, // Mismo tipo
                userId: userId,
                id: { [Op.ne]: categoryId } // Excluir la categoría actual
            }
        });
        if (existingCategoryWithNewName) {
            return res.status(400).json({ message: `Ya tienes otra categoría llamada "${name}" con el tipo "${category.type}".` });
        }
    }


    category.name = name || category.name;
    category.icon = icon !== undefined ? icon : category.icon;

    await category.save();
    res.status(200).json(category);
  } catch (error) {
    console.error('Error en updateCategory:', error);
    if (error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Error de validación o nombre duplicado.', errors: error.errors?.map(e => e.message) });
    }
    next(error);
  }
};

// @desc    Eliminar una categoría personalizada del usuario
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  try {
    const category = await Category.findOne({
      where: { id: categoryId, userId: userId } // Solo puede eliminar sus propias categorías
    });

    if (!category) {
      return res.status(404).json({ message: 'Categoría personalizada no encontrada o no te pertenece.' });
    }

    // Considerar qué hacer con las transacciones/presupuestos asociados.
    // Por ahora, solo eliminamos la categoría. Podrías necesitar:
    // 1. Impedir la eliminación si hay transacciones/presupuestos asociados.
    // 2. Reasignar transacciones/presupuestos a una categoría "Sin Categoría" o "Varios".
    // 3. Eliminar en cascada (configurado en el modelo o manejado aquí).
    // Por simplicidad, ahora solo la eliminamos. El ON DELETE CASCADE en el modelo Transaction
    // podría manejar esto si la FK es a Category.id, pero si la FK es a una tabla intermedia, es más complejo.
    // La relación Transaction -> Category tiene allowNull: false, por lo que no se podría eliminar si hay transacciones.
    // Habría que verificarlo primero.
    const transactionsExist = await db.Transaction.findOne({ where: { categoryId: categoryId, userId: userId }});
    if (transactionsExist) {
        return res.status(400).json({ message: 'No se puede eliminar la categoría porque tiene movimientos asociados. Reasigna los movimientos primero.' });
    }
    // Similar para presupuestos
    const budgetsExist = await db.Budget.findOne({ where: { categoryId: categoryId, userId: userId }});
    if (budgetsExist) {
        return res.status(400).json({ message: 'No se puede eliminar la categoría porque tiene presupuestos asociados.' });
    }


    await category.destroy();
    res.status(200).json({ message: 'Categoría personalizada eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteCategory:', error);
    next(error);
  }
};


module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories // Exportar para poder llamarla desde server.js si se desea
};
