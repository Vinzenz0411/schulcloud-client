import {render} from 'react-dom';
import {compose} from 'react-komposer';
import { FileService } from '../../core/helpers';
import { Permissions, Server, Notification, RandomIdGenerator } from '../../core/helpers/';

import component from '../components/file-explorer';
import actions from '../actions/file-explorer';

const composer = (props, onData) => {

	const currentUser = Server.get('user');
	const getFiles = (storageContext) => {
		var context = storageContext || `users/${currentUser._id}`;
		FileService.getFileList(context)
			.then(res => {
				let componentData = {
					actions,
					filesList: [],
					storageContext: context,
					onReload: getFiles
				};

				// if the storage provider does not return any files, there's no empty array but an ugly error message
				if( Object.prototype.toString.call( res ) === '[object Array]' ) {
					componentData.filesList = res;
					componentData.filesList.forEach(f => f.id = RandomIdGenerator.generateRandomId());
				} else {
					Notification.showError("Deine Schule hat bislang noch keine Dateiverwaltung ausgewählt");
				}

				onData(null, componentData);
			}).catch(err => {
				console.log(err);
				Notification.showError(err);
			});
	};

	getFiles();
};

export default compose(composer)(component);
