import Dropzone from 'dropzone';
import Vue from 'vue';

import 'semantic-ui-css/components/reset.css';
import 'semantic-ui-css/components/site.css';
import 'semantic-ui-css/components/button.css';
import 'semantic-ui-css/components/checkbox.css';
import 'semantic-ui-css/components/container.css';
import 'semantic-ui-css/components/dimmer.css';
import 'semantic-ui-css/components/divider.css';
import 'semantic-ui-css/components/form.css';
import 'semantic-ui-css/components/header.css';
import 'semantic-ui-css/components/icon.css';
import 'semantic-ui-css/components/loader.css';
import 'semantic-ui-css/components/message.css';
import 'semantic-ui-css/components/modal.css';
import 'semantic-ui-css/components/popup.css';
import 'semantic-ui-css/components/table.css';

import 'dropzone/dist/dropzone.css';

import Main from './app/Main.vue';
import VueNotifications from './plugins/VueNotifications';

Dropzone.autoDiscover = false;
Vue.use(VueNotifications);

new Vue({
	el: '#app',
	render: h => h(Main)
});
