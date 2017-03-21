import React from 'react/addons';
import Reflux from 'reflux';
import _ from 'underscore';
import {dataInterface} from '../dataInterface';
import {
  Navigation,
} from 'react-router';
import actions from '../actions';
import bem from '../bem';
import stores from '../stores';
import Select from 'react-select';
import ui from '../ui';
import mixins from '../mixins';
import mdl from '../libs/rest_framework/material';
import DocumentTitle from 'react-document-title';
import CopyToClipboard from 'react-copy-to-clipboard';

import {
  ProjectSettingsEditor,
  ProjectDownloads
} from '../components/formEditors';

import {
  assign,
  t,
  log,
  notify,
} from '../utils';

var FormSubScreens = React.createClass({
  mixins: [
    Navigation,
    Reflux.ListenerMixin,
    mixins.dmix,
    mixins.shareAsset
  ],
  updateRouteState () {
    var currentRoutes = this.context.router.getCurrentRoutes();
    var activeRoute = currentRoutes[currentRoutes.length - 1];
    this.setState(assign({
        currentRoute: activeRoute
      }
    ));
  },
  componentDidMount () {
    this.listenTo(stores.session, this.dmixSessionStoreChange);
    this.listenTo(stores.asset, this.dmixAssetStoreChange);
    var uid = this.props.params.assetid || this.props.uid || this.props.params.uid;
    if (this.props.randdelay && uid) {
      window.setTimeout(()=>{
        actions.resources.loadAsset({id: uid});
      }, Math.random() * 3000);
    } else if (uid) {
      actions.resources.loadAsset({id: uid});
    }

    this.updateRouteState();
  },
  componentWillReceiveProps () {
    this.updateRouteState();
  },
  render () {
    var formClass = '';
    var iframeUrl = '', report__base = '', subscreen = undefined;

    if (this.state.uid != undefined) {
      if (this.state.deployment__identifier != undefined) {
        var deployment__identifier = this.state.deployment__identifier;
        var report__base = deployment__identifier.replace('/forms/', '/reports/');
      }
      switch(this.state.currentRoute.name) {
        case 'form-data-report':
          iframeUrl = report__base+'/digest.html';
          break;
        case 'form-data-table':
          iframeUrl = report__base+'/export.html';
          break;
        case 'form-data-downloads':
          subscreen = <ProjectDownloads asset={this.state} />;
          break;
        case 'form-settings':
          subscreen = <ProjectSettingsEditor asset={this.state} />;
          break;
        case 'form-data-gallery':
          iframeUrl = deployment__identifier+'/photos';
          break;
        case 'form-data-map':
          iframeUrl = deployment__identifier+'/map';
          break;
        case 'form-settings-kobocat':
          iframeUrl = deployment__identifier+'/form_settings';
          break;
        case 'form-settings-sharing':
          return this.renderSharing();
          break;
        case 'form-collect-web': 
          return this.renderCollectWeb();
          break;
        case 'form-collect-android': 
          return this.renderCollectAndroid();
          break;
      }

      formClass = this.state.currentRoute.name;
    }

    var docTitle = this.state.name || t('Untitled');

    return (
        <DocumentTitle title={`${docTitle} | KoboToolbox`}>      
          <bem.FormView m={formClass}>
            {subscreen != undefined ? 
              {subscreen}
            : 
              <bem.FormView__cell m='iframe'>
                <iframe src={iframeUrl} />
              </bem.FormView__cell>
            }
          </bem.FormView>
        </DocumentTitle>
      );
  },
  renderCollectWeb () {
    var docTitle = this.state.name || t('Untitled');
    var deployment__links = this.state.deployment__links;
    var available__links = {
        offline_url: {
          label: t('Online-Offline (multiple submission)'),
          desc: t('This allows online and offline submissions and is the best option for collecting data in the field. ')
        },
        url: {
          label: t('Online-Only (multiple submissions)'),
          desc: t('This is the best option when entering many records at once on a computer, e.g. for transcribing paper records')
        },
        iframe_url: {
          label: t('Embeddable web form code'),
          desc: t('Use this html5 code snippet to integrate your form on your own website using smaller margins. ')
        },
        preview_url: {
          label: t('View only'),
          desc: t('Use this version for testing, getting feedback. Does not allow submitting data. ')
        }
    };

    var deployment__links_list = [];
    var value = undefined;
 
    for (var key in available__links) {
      if (key == 'iframe_url')
        value = '<iframe src="'+deployment__links[key]+'" width="800" height="600"></iframe>';
      else
        value = deployment__links[key];

      deployment__links_list.push(
        {
          key: key,
          value: value,
          label: available__links[key].label,
          desc: available__links[key].desc
        }
      );

    }

    return (
        <DocumentTitle title={`${docTitle} | KoboToolbox`}>      
          <bem.FormView>
            <bem.FormView__row>
              <bem.FormView__cell m='columns'>
                <bem.FormView__cell m='label'>
                    {t('Choose an option to collect data with web forms')}
                </bem.FormView__cell>
              </bem.FormView__cell>
              <bem.FormView__cell m='box'>
                {deployment__links_list.map((c)=>{
                  return (
                      <bem.FormView__cell m={['collect-row']} key={`c-${c.key}`}>
                        {c.key != 'iframe_url' ? 
                          <a className="collect-link" target="_blank" href={c.value}>{c.label}</a>
                        :
                          <a className="collect-link">{c.label}</a>
                        }
                        
                        <div className="desc">{c.desc}</div>
                        {c.key == 'iframe_url' && 
                          <code>{c.value}</code>
                        }
                        {c.key != 'iframe_url' && 
                          <CopyToClipboard text={c.value} options={{debug: true}} onCopy={() => notify('copied to clipboard')}>
                            <a className="copy mdl-button mdl-js-button mdl-button--colored">{t('Copy link')}</a>
                          </CopyToClipboard>
                        }
                      </bem.FormView__cell>
                    );
                })}

              </bem.FormView__cell>
            </bem.FormView__row>
          </bem.FormView>
        </DocumentTitle>
    );
  },
  renderCollectAndroid () {
    var docTitle = this.state.name || t('Untitled');
    var kc_server = document.createElement('a');
    kc_server.href = this.state.deployment__identifier;
    var kobocollect_url = kc_server.origin + '/' + this.state.owner__username;

    return (
        <DocumentTitle title={`${docTitle} | KoboToolbox`}>      
          <bem.FormView>
            <bem.FormView__row>
              <bem.FormView__cell m='columns'>
                <bem.FormView__cell m='label'>
                    {t('Collect data with our Android app')}
                </bem.FormView__cell>
              </bem.FormView__cell>
              <bem.FormView__cell m='box'>
                <bem.FormView__cell m={['padding', 'collect-android']}>
                  <ol>
                    <li>
                      {t('Install')}
                      &nbsp;
                      <a href="https://play.google.com/store/apps/details?id=org.koboc.collect.android&hl=en" target="_blank">KoboCollect</a>
                      &nbsp;
                      {t('on your Android device.')}
                    </li>
                    <li>{t('Click on')} <i className="k-icon-more"></i> {t('to open settings.')}</li>
                    <li>
                      {t('Enter the server URL')}&nbsp;
                      <code>{kobocollect_url}</code>&nbsp;
                      {t('and your username and password')}
                    </li>
                    <li>{t('Open "Get Blank Form" and select this project. ')}</li>
                    <li>{t('Open "Enter Data."')}</li>
                  </ol>

                  <a className="mdl-button mdl-js-button mdl-button--raised mdl-button--colored"
                      href="https://play.google.com/store/apps/details?id=org.koboc.collect.android&hl=en">
                    {t('Download KoboCollect')}
                  </a>
                  <bem.FormView__cell>
                    <a href="http://support.kobotoolbox.org/customer/en/portal/articles/1653782-collecting-data-with-kobocollect-on-android">
                      {t('Learn more about KoboCollect')}
                    </a>
                  </bem.FormView__cell>
                </bem.FormView__cell>
              </bem.FormView__cell>
            </bem.FormView__row>
          </bem.FormView>
        </DocumentTitle>
    );
  },
  renderSharing() {
    var docTitle = this.state.name || t('Untitled');
    return (
        <DocumentTitle title={`${docTitle} | KoboToolbox`}>
          <bem.FormView m={'settings-sharing'}>
            {this.sharingForm()}
          </bem.FormView>
        </DocumentTitle>
    );
  },
  componentDidUpdate() {
    mdl.upgradeDom();
  }

})

export default FormSubScreens;
