const userService = require('./user.service');
const { success } = require('../../shared/utils/apiResponse');

async function listUsers(req, res) {
  const data = await userService.listUsers();
  return success(res, 'Users retrieved', data);
}

async function deleteUser(req, res) {
  const data = await userService.deleteUserById(req.params.id);
  return success(res, 'User deleted', data);
}

module.exports = {
  listUsers,
  deleteUser,
};
