// Ruta: finanzas-app-pro/backend/models/category.model.js
// ARCHIVO NUEVO
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Category = sequelize.define("category", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: { // 'ingreso' o 'egreso'
      type: DataTypes.ENUM('ingreso', 'egreso'),
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    // userId: Clave foránea para categorías personalizadas por el usuario.
    // Las categorías globales/por defecto podrían no tener userId o un userId especial.
    // Esto se manejará en la lógica del controlador.
    // Si una categoría es global, userId podría ser NULL.
    // Si es de un usuario, tendrá el ID del usuario.
    // La relación se define en models/index.js
  }, {
    tableName: 'categories',
    timestamps: true, // createdAt y updatedAt
    // Índices para búsquedas comunes
    indexes: [
      {
        unique: false,
        fields: ['userId', 'type'] // Para buscar categorías de un usuario por tipo
      },
      {
        unique: true, // Un usuario no debería tener dos categorías con el mismo nombre y tipo
        fields: ['userId', 'name', 'type'],
        name: 'unique_user_category_name_type'
      }
    ]
  });

  return Category;
};
