// Ruta: finanzas-app-pro/backend/models/permission.model.js
module.exports = (sequelize, Sequelize, DataTypes) => {
  const Permission = sequelize.define("permission", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: { // ej: "manage_users", "view_transactions", "edit_own_profile"
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'permissions',
    timestamps: true
  });

  return Permission;
};