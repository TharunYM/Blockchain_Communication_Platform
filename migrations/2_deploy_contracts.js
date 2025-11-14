const SecureMessaging = artifacts.require("SecureMessaging");

module.exports = function (deployer) {
  deployer.deploy(SecureMessaging);
};