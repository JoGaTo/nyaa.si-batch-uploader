import './index.css';

const DEFAULT_DELAY = 10000;
const MAX_NOTIFICATIONS = 5;

export default function(Vue) {

	Vue.prototype.$notify = function(data) {

		if (!data) return;

		let type, message, duration;

		if (data.constructor === String) {
			type = 'info';
			duration = DEFAULT_DELAY;
			message = data;
		} else if (data.constructor === Object) {
			type = data.type;
			duration = data.duration || DEFAULT_DELAY;
			message = data.message || data.text || data.data;
		}

		if (type && message)
			createNotification(type, (duration || DEFAULT_DELAY), message);

	};

	Vue.prototype.$notify.info = function(data) { doNotify('info', data); };
	Vue.prototype.$notify.success = function(data) { doNotify('success', data); };
	Vue.prototype.$notify.error = function(data) { doNotify('error', data); };
	Vue.prototype.$notify.warn = function(data) { doNotify('warn', data); };
	Vue.prototype.$notify.warning = function(data) { doNotify('warning', data); };

	const doNotify = function(type, data) {
		if (!data) return;
		if (data.constructor === String)
			return Vue.prototype.$notify({ type: type, message: data });
		else if (data.constructor === Object)
			return Vue.prototype.$notify(Object.assign({ }, data, { type: type }));
	}

}

/*---------
  Utilities
  ---------*/

function closeNotification(notification, delay) {
	setTimeout(() => {
		if (notification.parentNode === null) return;
		notification.parentNode.removeChild(notification);
	}, (delay || 0));
}

const getContainer = function() {
	const result = document.getElementById('notificationContainer');
	if (result) return result;
	const container = document.createElement('div');
	container.id = 'notificationContainer';
	document.body.appendChild(container);
	return container;
};

const createNotification = function(type, duration, message) {
	const notification = document.createElement('div');
	notification.className = 'notification ui tiny message ' + convertType(type);
	notification.innerHTML = `<i class="${convertIcon(type)} icon"></i> ${message}`;
	notification.addEventListener('click', () => closeNotification(notification, 0), false);
	if (duration !== 0) closeNotification(notification, duration);
	const container = getContainer();
	container.appendChild(notification);
	while (container.children.length > MAX_NOTIFICATIONS)
		container.removeChild(container.children[0]);
};

const convertType = function(type) {
	switch (type.toLowerCase()) {
		case 'success':
			return 'green';
		case 'warn':
		case 'warning':
			return 'orange';
		case 'error':
		case 'danger':
			return 'red';
		default:
			return 'blue';
	}
};

const convertIcon = function(type) {
	switch (type.toLowerCase()) {
		case 'success':
			return 'checkmark';
		case 'warn':
		case 'warning':
			return 'warning';
		case 'error':
		case 'danger':
			return 'warning sign';
		default:
			return 'info circle';
	}
};