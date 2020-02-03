import { STATES as videoconferenceStates } from './videoconference';

/* eslint-disable max-len */
$(document).ready(() => {
	$('.js-course-name-input').change(function courseNameInput() {
		$(this).val($(this).val().trim());
	});

	$('.btn-hidden-toggle').click(function hiddenToggle(e) {
		e.stopPropagation();
		e.preventDefault();
		const $hiddenToggleBtn = $(this);
		const $hiddenToggleIcon = $(this).find('.fa');
		const $card = $(this).closest('.card');
		const href = $(this).attr('href');
		$.ajax({
			method: 'PATCH',
			url: `${href}?json=true`,
			data: { hidden: !$hiddenToggleIcon.hasClass('fa-eye-slash') },
			success(result) {
				if (result.hidden) {
					$hiddenToggleIcon.addClass('fa-eye-slash');
					$hiddenToggleIcon.removeClass('fa-eye');
					$hiddenToggleBtn.attr('data-original-title', 'Thema sichtbar machen');
					$card.addClass('card-transparent');
				} else {
					$hiddenToggleIcon.removeClass('fa-eye-slash');
					$hiddenToggleIcon.addClass('fa-eye');
					$hiddenToggleBtn.attr('data-original-title', 'Thema verstecken');
					$card.removeClass('card-transparent');
				}
			},
		});
	});

	$('.btn-create-invitation').click(function createInvitation(e) {
		e.stopPropagation();
		e.preventDefault();
		const target = `${$(this).attr('data-href')}addStudent`;
		const $invitationModal = $('.invitation-modal');
		$.ajax({
			type: 'POST',
			url: '/link/',
			beforeSend(xhr) {
				// eslint-disable-next-line no-undef
				xhr.setRequestHeader('Csrf-Token', csrftoken);
			},
			data: {
				target,
			},
			success(data) {
				populateModalForm($invitationModal, {
					title: 'Einladungslink generiert!',
					closeLabel: 'Abbrechen',
					submitLabel: 'Speichern',
					fields: { invitation: data.newUrl },
				});
				$invitationModal.find('.btn-submit').remove();
				$invitationModal.find("input[name='invitation']").click(function inputNameInvitation() {
					$(this).select();
				});

				$invitationModal.appendTo('body').modal('show');
			},
		});
	});


	$('.btn-import-topic').click(function importTopic(e) {
		e.stopPropagation();
		e.preventDefault();
		const courseId = $(this).attr('data-courseId');
		const $importModal = $('.import-modal');
		populateModalForm($importModal, {
			title: 'Thema importieren',
			closeLabel: 'Abbrechen',
			submitLabel: 'Speichern',
			fields: { courseId },
		});

		const $modalForm = $importModal.find('.modal-form');
		$modalForm.attr('action', `/courses/${courseId}/importTopic`);
		$importModal.appendTo('body').modal('show');
	});

	$('.move-handle').click((e) => {
		e.stopPropagation();
	});

	if ($('#topic-list').length) {
		$('#topic-list').sortable({
			placeholder: 'ui-state-highlight',
			handle: '.move-handle',
			update() {
				const positions = {};
				$('#topic-list .card-topic').each(function topicListCardTopic(i) {
					positions[($(this).attr('data-topicId'))] = i;
				});
				const courseId = $(this).attr('data-courseId');
				$.ajax({
					type: 'PATCH',
					url: `/courses/${courseId}/positions`,
					data: positions,
				});
			},
		});

		$('#topic-list').disableSelection();
	}

	$('.btn-create-share-course').click(function createShareCourse(e) {
		e.stopPropagation();
		e.preventDefault();
		const courseId = $(this).attr('data-courseId');
		const $shareModal = $('.share-modal');
		$.ajax({
			type: 'GET',
			url: `/courses/${courseId}/share/`,
			success(data) {
				populateModalForm($shareModal, {
					title: 'Kopiercode generiert!',
					closeLabel: 'Schließen',
					fields: { shareToken: data.shareToken },
				});
				$shareModal.find('.btn-submit').remove();
				$shareModal.find("input[name='shareToken']").click(function inputNameShareToken() {
					$(this).select();
				});

				$shareModal.appendTo('body').modal('show');

				// eslint-disable-next-line max-len
				$("label[for='shareToken']").text('Verteile folgenden Code an einen Lehrer-Kollegen, um den Kurs mit diesem zu teilen. Die Funktion befindet sich auf der Übersichtsseite für Kurse.');
				// eslint-disable-next-line no-undef
				const image = kjua({
					text: `${$('meta[name=baseUrl]').attr('content')}/courses?import=${data.shareToken}`,
					render: 'image',
				});
				const $shareqrbox = $('.course-qr');
				$shareqrbox.empty();
				// eslint-disable-next-line max-len
				$shareqrbox.append('<p>Alternativ kannst du deinen Lehrer-Kollegen auch folgenden QR-Code zeigen. </p>');
				$shareqrbox.append(image);
			},
		});
	});

	let activeBbbCard = false;

	if ($('.bbbTool').length > 0) {
		const courseId = $('.bbbTool').parent().attr('data-courseId');

		const videoconferenceResponse = (data) => {
			activeBbbCard = true;
			const { permission, state } = data;

			const guestInactiveState = {
				condition: videoconferenceStates.GuestInactiveState.condition,
				displayDomElements: () => {
					$('.bbbTool').off('click').css({
						cursor: 'auto',
						backgroundColor: 'white',
					});

					$('.bbb-state').hide();
					$('.bbb-guest-inactive-state').show();

					$('.bbbTool-reload-icon').off('click').on('click', (e) => {
						e.stopPropagation();
						e.preventDefault();
						$.ajax({
							type: 'GET',
							url: `/videoconference/course/${courseId}`,
							success: videoconferenceResponse,
						}).done((res) => {
							if (res.state === 'RUNNING') {
								$('.bbb-state').hide();
								$('.bbb-running-videoconference-state').show();
							}
						});
					});
				},
			};

			const modInactiveState = {
				condition: videoconferenceStates.ModeratorInactiveState.condition,
				displayDomElements: () => {
					$('.bbb-state').hide();
					$('.bbb-moderator-inactive-state').show();
				},
			};

			const runningState = {
				condition: videoconferenceStates.RunningState.condition,
				displayDomElements: () => {
					$('.bbb-state').hide();
					$('.bbb-running-videoconference-state').show();

					$('.bbbTool').off('click').css({ cursor: 'pointer' }).on('click', () => {
						$.post('/videoconference/', {
							scopeId: courseId,
							scopeName: 'course',
							options: {},
						}, (response) => {
							window.open(response.url, '_blank');
						});
					});
				},
			};

			// eslint-disable-next-line func-names
			$('.bbbTool').each(() => {
				[guestInactiveState, modInactiveState, runningState].forEach((bbbState) => {
					if (bbbState.condition(permission, state)) bbbState.displayDomElements();
				});
			});
		};

		$.ajax({
			type: 'GET',
			url: `/videoconference/course/${courseId}`,
			success: videoconferenceResponse,
		});
	}


	// eslint-disable-next-line func-names
	$('.bbbTool').click(function (e) {
		if (!activeBbbCard) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
		const courseId = $(this).parent().attr('data-courseId');
		const $createVideoconferenceModal = $('.create-videoconference-modal');

		$.ajax({
			type: 'GET',
			url: `/courses/${courseId}/usersJson`,
			success(data) {
				populateModalForm($createVideoconferenceModal, {
					title: `Videokonferenzraum "${data.course.name}" erstellen`,
					closeLabel: 'Abbrechen',
					submitLabel: 'Erstellen',
				});
			},
		});
		$createVideoconferenceModal.appendTo('body').modal('show');
		$createVideoconferenceModal.off('submit').on('submit', (event) => {
			event.preventDefault();

			const everyAttendeJoinsMuted = $createVideoconferenceModal.find('[name=startMuted]').is(':checked');
			const moderatorMustApproveJoinRequests = $createVideoconferenceModal.find('[name=requestModerator]').is(':checked');
			const everybodyJoinsAsModerator = $createVideoconferenceModal.find('[name=everyoneIsModerator]').is(':checked');

			$.post('/videoconference/', {
				scopeId: courseId,
				scopeName: 'course',
				options: {
					// everyAttendeJoinsMuted,
					// moderatorMustApproveJoinRequests,
					// everybodyJoinsAsModerator,
				},
			}, (response) => {
				// todo, the browser may block popups...
				window.open(response.url, '_blank');
				$('.bbb-state').hide();
				$('.bbb-running-videoconference-state').show();
				$('.bbbTool').off('click').css({ cursor: 'pointer' }).on('click', () => window.open(response.url, '_blank'));
			});
			$createVideoconferenceModal.modal('hide');
		});
	});

	$('.bbbTool-info-icon').click((e) => {
		e.stopPropagation();
		e.preventDefault();

		const $bbbReloadInfoModal = $('.reload-info-modal');

		populateModalForm($bbbReloadInfoModal, {
			title: '',
			closeLabel: 'OK',
		});

		$bbbReloadInfoModal.appendTo('body').modal('show');
	});
});
