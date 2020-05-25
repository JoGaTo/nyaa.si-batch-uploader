<script>
    import Dropzone from 'dropzone';

    const SESSION_ID = Math.floor(Date.now() * Math.random());

    export default {

        data() {
            return {
                model: {
                    username: null,
                    password: null,
                    category: '',
                    information: null,
                    description: null,
                    sukebei: true,
                    anonymous: false,
                    hidden: false,
                    complete: false,
                    remake: false,
                    trusted: true
                },
                dropzone: null,
				files: { },
				result: { }
            };
        },

        methods: {

        	/*----- UI -----*/

            clear() {
				this.dropzone.removeAllFiles();
				for (let file in this.files) delete this.files[file];
            },
            submit() {
                localStorage.setItem('mass.data', JSON.stringify(this.model));
                this.dropzone.processQueue();
            },
            shutdown() {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'shutdown');
                xhr.send();
            },
            closeModal(e) {
            	if (e && e.target.id !== 'closeModalButton' && e.target.id !== 'modalDimmer') return;
                this.$refs.modalDimmer.classList.remove('active');
            },

			/*----- Dropzone -----*/

            onFileAdded(file) {
				if (file.type !== 'application/x-bittorrent')
					this.dropzone.removeFile(file);
				this.files[file.name] = file;
			},
			onProcessingStart() {
				this.$refs.dimmer.classList.add('active');
			},
			onProcessing(file, xhr, data) {
				if (!data.has('data'))
					data.append('data', JSON.stringify(Object.assign({ sessionId: SESSION_ID }, this.model)));
			},
			onProcessingSuccess(file, response) {
				this.result = response;
				this.$refs.modalDimmer.classList.add('active');
				this.dropzone.removeAllFiles();
				for (let filename in this.files) {
					if (!response.hasOwnProperty(filename) || response[ filename ].result)
						delete this.files[filename];
					else
						this.dropzone.addFile(this.files[filename]);
				}
			},
			onProcessingEnd() {
				this.$refs.dimmer.classList.remove('active');
			},

			/*----- WebSocket -----*/

			onWebSocketMessage(message) {
				const data = JSON.parse(message.data);
				if (data.sessionId !== null && data.sessionId !== SESSION_ID) return;
                this.$notify({ type: data.type, message: data.message });
			}

        },

        mounted() {

			this.webSocket = new WebSocket(`ws://${window.location.host}/ws`);
			this.webSocket.onmessage = this.onWebSocketMessage;

            this.dropzone = new Dropzone('#dropzone', {
				url: 'proceed',
				autoProcessQueue: false,
				uploadMultiple: true,
				paramName: () => 'file',
                parallelUploads: 5000,
                maxFiles: 5000
			});

            this.dropzone.on('addedfile', this.onFileAdded);
			this.dropzone.on('processingmultiple', this.onProcessingStart);
			this.dropzone.on('sending', this.onProcessing);
			this.dropzone.on('successmultiple', this.onProcessingSuccess);
			this.dropzone.on('queuecomplete', this.onProcessingEnd);

            if (localStorage.hasOwnProperty('mass.data')) {
                const data = JSON.parse(localStorage.getItem('mass.data'));
                for (let key in data)
                    this.model[key] = data[key];
            }

            this.$watch('model.sukebei', () => this.model.category = '');

        }

    }
</script>

<template>
    <div class="ui main container">

		<!-- Dimmer -->

		<div class="ui dimmer" ref="dimmer">
			<div class="ui loader"></div>
		</div>

		<!-- Modal -->

        <div class="ui dimmer" id="modalDimmer" ref="modalDimmer" @click="closeModal">
            <div class="ui active large modal">
                <div class="header">Results</div>
                <div class="content">
                    <table class="ui small table striped">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(result,file) in result">
                                <td>{{file}}</td>
                                <td v-if="result.result" class="td-true">OK</td>
                                <td v-else class="td-false" v-html="result.reason"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="actions">
                    <div class="ui positive button" id="closeModalButton" @click="closeModal">Close</div>
                </div>
            </div>
        </div>

        <div class="ui dividing main header extended">
            Nyaa Mass Upload
            <button class="ui mini red button" id="shutdown" @click="shutdown"
                    data-tooltip="Shutdown" data-inverted data-position="bottom right">
                <i class="power icon"></i>
            </button>
        </div>

        <div id="content">

            <form class="ui form">

				<!-- Mandatory fields -->

				<div class="ui dividing sub red header">Mandatory</div>

               <div class="three fields">
				<div class="ui field checkbox">
					<input id="a" type="checkbox" v-model="model.sukebei">
					<label for="a">Upload to Sukebei</label>
				</div>
                <div class="ui field checkbox">
					<input id="b" type="checkbox" v-model="model.pantsu">
					<label for="b">Upload to NyaaPantsu</label>
				</div>
				<div class="ui field checkbox">
					<input id="c" type="checkbox" v-model="model.sukebepantsu">
					<label for="c">Upload to NyaaPantsu Sukebei</label>
				</div>
				</div>
				
                <div class="three fields">
                    <div class="field">
                        <label>Username</label>
                        <input type="text" v-model="model.username">
                    </div>
                    <div class="field">
                        <label>Password</label>
                        <input type="password" v-model="model.password">
                    </div>
                    <div class="field">
                        <label>Category (same for every torrent)</label>
						<select v-model="model.category" v-if="!model.sukebei">
							<option value=""></option>
							<option value="1_1">Anime - AMV</option>
							<option value="1_2">Anime - English</option>
							<option value="1_3">Anime - Non-English</option>
							<option value="1_4">Anime - Raw</option>
							<option value="2_1">Audio - Lossless</option>
							<option value="2_2">Audio - Lossy</option>
							<option value="3_1">Literature - English-translated</option>
							<option value="3_2">Literature - Non-English</option>
							<option value="3_3">Literature - Non-English-Translated</option>
							<option value="3_4">Literature - Raw</option>
							<option value="4_1">Live Action - English-translated</option>
							<option value="4_2">Live Action - Idol/Promotional Video</option>
							<option value="4_3">Live Action - Non-English-translated</option>
							<option value="4_4">Live Action - Raw</option>
							<option value="5_1">Pictures - Graphics</option>
							<option value="5_2">Pictures - Photos</option>
							<option value="6_1">Software - Applications</option>
							<option value="6_2">Software - Games</option>
						</select>
						<select v-model="model.category" v-if="model.sukebei">
							<option value=""></option>
							<option value="1_1">Art - Anime</option>
							<option value="1_2">Art - Doujinshi</option>
							<option value="1_3">Art - Games</option>
							<option value="1_4">Art - Manga</option>
							<option value="1_5">Art - Pictures</option>
							<option value="2_1">Real Life - Photobooks / Pictures</option>
							<option value="2_2">Real Life - Videos</option>
						</select>
                    </div>
                </div>
				
				
			<div class="ui dividing sub green header">Optional only for NyaaPantsu</div>	
				 <div class="form-input language">
                 

<span class="input-group">
<span class="upload-lang-languagename">Catalan</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-ca" value="ca"><label for="upload-lang-ca" class="flag flag-ca" title="Catalan"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">German</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-de" value="de"><label for="upload-lang-de" class="flag flag-de" title="German"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">English</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-en" value="en"><label for="upload-lang-en" class="flag flag-en" title="English"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Spanish, Mexican Spanish</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-es" value="es"><label for="upload-lang-es" class="flag flag-es" title="Spanish, Mexican Spanish"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">French</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-fr" value="fr"><label for="upload-lang-fr" class="flag flag-fr" title="French"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Hungarian</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-hu" value="hu"><label for="upload-lang-hu" class="flag flag-hu" title="Hungarian"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Indonesian</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-id" value="id"><label for="upload-lang-id" class="flag flag-id" title="Indonesian"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Icelandic</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-is" value="is"><label for="upload-lang-is" class="flag flag-is" title="Icelandic"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Italian</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-it" value="it"><label for="upload-lang-it" class="flag flag-it" title="Italian"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Japanese</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-ja" value="ja"><label for="upload-lang-ja" class="flag flag-ja" title="Japanese"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Korean</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-ko" value="ko"><label for="upload-lang-ko" class="flag flag-ko" title="Korean"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Norwegian Bokmål</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-nb" value="nb"><label for="upload-lang-nb" class="flag flag-nb" title="Norwegian Bokmål"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Dutch</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-nl" value="nl"><label for="upload-lang-nl" class="flag flag-nl" title="Dutch"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Portuguese</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-pt" value="pt"><label for="upload-lang-pt" class="flag flag-pt" title="Portuguese"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Romanian</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-ro" value="ro"><label for="upload-lang-ro" class="flag flag-ro" title="Romanian"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Russian</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-ru" value="ru"><label for="upload-lang-ru" class="flag flag-ru" title="Russian"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Swedish</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-sv" value="sv"><label for="upload-lang-sv" class="flag flag-sv" title="Swedish"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Thai</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-th" value="th"><label for="upload-lang-th" class="flag flag-th" title="Thai"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Chinese</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-zh" value="zh"><label for="upload-lang-zh" class="flag flag-zh" title="Chinese"></label>
</span><span class="input-group">
<span class="upload-lang-languagename">Traditional Chinese</span>
<input type="checkbox" name="languages" class="form-language-checkbox" id="upload-lang-zh-Hant" value="zh-Hant"><label for="upload-lang-zh-Hant" class="flag flag-Hant" title="Traditional Chinese"></label>
</span>


               </div>

				<!-- Optional fields -->

				<div class="ui dividing sub blue header">Optional</div>

                <div class="two fields">
                    <div class="field">
                        <label>Information (same for every torrent)</label>
                        <input type="text" v-model="model.information">
                    </div>
					</br>
                    <div class="field">
                        <label>Description (same for every torrent)</label>
                        <input type="textarea" v-model="model.description"> 
                    </div>
                </div>

                <div class="three fields">
                    <div class="ui field checkbox">
                        <input id="b" type="checkbox" v-model="model.anonymous">
                        <label for="b">Upload anonymously</label>
                    </div>
                    <div class="ui field checkbox">
                        <input id="c" type="checkbox" v-model="model.hidden">
                        <label for="c">Mark as hidden</label>
                    </div>
					<div class="ui field checkbox">
						<input id="d" type="checkbox" v-model="model.complete">
						<label for="d">Mark as complete</label>
					</div>
                </div>

                <div class="three fields">
                    <div class="ui field checkbox">
                        <input id="e" type="checkbox" v-model="model.remake">
                        <label for="e">Mark as remake</label>
                    </div>
                    <div class="ui field checkbox">
                        <input id="f" type="checkbox" v-model="model.trusted">
                        <label for="f">Mark as trusted (if possible)</label>
                    </div>
                </div>

            </form>

            <h2 class="ui divider"></h2>

            <div id="dropzone" class="dropzone">
            </div>
            
            <br />

			<div id="buttonContainer">
				<button class="ui blue labeled icon button" @click="clear">
					<i class="remove icon"></i>
					Clear
				</button>
				<button class="ui red labeled icon button" @click="submit"
						:disabled="!model.username || !model.password || !model.category">
					<i class="upload icon"></i>
					Upload
				</button>
			</div>

        </div>

    </div>
</template>

<style>
	.main.header {
		margin-top: 0;
		padding-top: 10px;
	}

	#buttonContainer {
		text-align: right;
		margin-bottom: 15px;
	}

	.ui.dimmer {
		position: fixed;
	}

	.sub.header {
		margin-bottom: 10px !important;
	}

	.td-true, .td-false { font-weight: bold; }
	.td-true { color: green; }
	.td-false { color: red; }

    .ui.modal {
        top: 0 !important;
        margin-top: 40px !important;
    }

    .ui.modal .content {
        max-height: 600px;
        overflow-y: auto;
    }

    #shutdown {
        float: right;
        padding: 7px;
        position: relative;
        z-index: 500000;
    }

    #shutdown > i {
        opacity: 1;
        margin: 0;
    }

    #dropzone {
        width: 100%;
        border: 1px dashed black;
        height: 500px;
        position: relative;
        padding: 2px !important;
    }

    .dz-preview {
        display: block !important;
        margin: 2px !important;
        min-height: auto !important;
    }

    .dz-image, .dz-progress, .dz-error-message {
        display: none !important;
    }

    .dz-details {
        position: relative !important;
        padding: 5px !important;
        text-align: left !important;
        background: #EEE !important;
        height: 45px !important;
    }

    .dz-size > span, .dz-filename > span {
        background: inherit !important;
        border: none !important;
    }

    .dz-filename {
        position: absolute !important;
        top: 5px !important;
    }

    .dz-size {
        margin-bottom: 0 !important;
        position: absolute !important;
        top: 20px !important;
    }
</style>
