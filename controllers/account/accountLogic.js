const authHelper = require('../../helpers/authentication');

const mainRoute = (req, res, api) => {
	const {
		firstName,
		lastName,
		email,
		password,
		passwordNew,
		language,
	} = req.body;
	return api.patch(`/accounts/${res.locals.currentPayload.accountId}`, {
		json: {
			password_verification: password,
			password: passwordNew !== '' ? passwordNew : undefined,
		},
	}).then(() => api.patch(`/users/${res.locals.currentUser._id}`, {
		json: {
			firstName,
			lastName,
			email,
			language,
		},
	}).then(authHelper.populateCurrentUser.bind(this, req, res)).then(() => {
		res.redirect('/account/');
	})).catch((err) => {
		res.render('account/settings', {
			title: res.$t('account.headline.yourAccount'),
			notification: {
				type: 'danger',
				message: err.error.message,
			},
		});
	});
};

module.exports = {
	mainRoute,
};
