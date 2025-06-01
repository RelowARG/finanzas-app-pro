// Ruta: finanzas-app-pro/backend/models/rolePermission.model.js
module.exports = (sequelize, Sequelize, DataTypes) => {
  const RolePermission = sequelize.define("rolePermission", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roleName: { // 'user', 'admin' (corresponde al User.role)
      type: DataTypes.STRING,
      allowNull: false,
    }
    // permissionId se añadirá por la asociación
    // No hay timestamps explícitos aquí, Sequelize los maneja si no se especifica { timestamps: false }
  }, {
    tableName: 'role_permissions',
    timestamps: true, // Puedes decidir si necesitas timestamps aquí
    indexes: [
      {
        unique: true,
        fields: ['roleName', 'permissionId']
      }
    ]
  });

  return RolePermission;
};