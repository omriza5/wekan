// ...existing code...
import { ReactiveCache } from '/imports/reactiveCache';

Meteor.subscribe('user-admin');
Meteor.subscribe('boards');
Meteor.subscribe('setting');
Meteor.subscribe('announcements');
Template.header.onCreated(function () {
  const templateInstance = this;
  templateInstance.currentSetting = new ReactiveVar();
  templateInstance.isLoading = new ReactiveVar(false);
  templateInstance.showAiPrompt = new ReactiveVar(false);
  templateInstance.aiPromptText = new ReactiveVar('');

  Meteor.subscribe('setting', {
    onReady() {
      templateInstance.currentSetting.set(ReactiveCache.getCurrentSetting());
      let currSetting = templateInstance.currentSetting.curValue;
      if (
        currSetting &&
        currSetting !== undefined &&
        currSetting.customLoginLogoImageUrl !== undefined &&
        document.getElementById('headerIsSettingDatabaseCallDone') != null
      )
        document.getElementById(
          'headerIsSettingDatabaseCallDone',
        ).style.display = 'none';
      else if (
        document.getElementById('headerIsSettingDatabaseCallDone') != null
      )
        document.getElementById(
          'headerIsSettingDatabaseCallDone',
        ).style.display = 'block';
      return this.stop();
    },
  });
});
Template.header.helpers({
  showAiPrompt() {
    return Template.instance().showAiPrompt.get();
  },
  aiPromptText() {
    return Template.instance().aiPromptText.get();
  },
  wrappedHeader() {
    return !Session.get('currentBoard');
  },

  hideLogo() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },

  appIsOffline() {
    return !Meteor.status().connected;
  },

  hasAnnouncement() {
    const announcements = Announcements.findOne();
    return announcements && announcements.enabled;
  },

  announcement() {
    $('.announcement').show();
    const announcements = Announcements.findOne();
    return announcements && announcements.body;
  },
});

Template.header.events({
  'click .ai-prompt-close'(event, template) {
    event.preventDefault();
    template.showAiPrompt.set(false);
    template.aiPromptText.set('');
  },
  'click .js-create-board': Popup.open('headerBarCreateBoard'),
  'click .js-close-announcement'() {
    $('.announcement').hide();
  },
  'click .js-select-list'() {
    Session.set('currentList', this._id);
    Session.set('currentCard', null);
  },
  'click .js-toggle-desktop-drag-handles'() {
    //currentUser = Meteor.user();
    //if (currentUser) {
    //  Meteor.call('toggleDesktopDragHandles');
    //} else if (window.localStorage.getItem('showDesktopDragHandles')) {
    if (window.localStorage.getItem('showDesktopDragHandles')) {
      window.localStorage.removeItem('showDesktopDragHandles');
      location.reload();
    } else {
      window.localStorage.setItem('showDesktopDragHandles', 'true');
      location.reload();
    }
  },
  'click .js-ai-action'(event, template) {
    event.preventDefault();
    template.showAiPrompt.set(true);
  },
  'input .ai-prompt-input'(event, template) {
    template.aiPromptText.set(event.target.value);
  },
  'click .ai-prompt-submit'(event, template) {
    event.preventDefault();
    const prompt = template.aiPromptText.get();
    // alert(`AI Prompt Submitted: ${prompt}`);
    console.log(prompt);
    // Send POST request to browser automation server
    fetch('http://localhost:4004/browser-automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ steps: prompt }),
    })
      .then((response) => response.json())
      .then((data) => {
        // You can handle the server response here if needed
        console.log('Server response:', data);
      })
      .catch((error) => {
        console.error('Error sending prompt:', error);
      });

    template.showAiPrompt.set(false);
    template.aiPromptText.set('');
  },
});

Template.offlineWarning.events({
  'click a.app-try-reconnect'(event) {
    event.preventDefault();
    Meteor.reconnect();
  },
});
