import { Trans, t } from '@lingui/macro';
import React, { PureComponent } from 'react';

import { AppEvents, SelectableValue } from '@grafana/data';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime/src';
import { Alert, ClipboardButton, Field, FieldSet, Icon, Input, RadioButtonGroup, Switch } from '@grafana/ui';
import config from 'app/core/config';
import { appEvents } from 'app/core/core';

import { ShareModalTabProps } from './types';
import { buildImageUrl, buildShareUrl } from './utils';

const currentThemeTranstation = t({
  id: 'share-modal.link.theme-current',
  message: `Current`,
});

const darkThemeTranstation = t({
  id: 'share-modal.link.theme-dark',
  message: `Dark`,
});

const lightThemeTranstation = t({
  id: 'share-modal.link.theme-light',
  message: `Light`,
});

const themeOptions: Array<SelectableValue<string>> = [
  { label: currentThemeTranstation, value: 'current' },
  { label: darkThemeTranstation, value: 'dark' },
  { label: lightThemeTranstation, value: 'light' },
];

export interface Props extends ShareModalTabProps {}

export interface State {
  useCurrentTimeRange: boolean;
  useShortUrl: boolean;
  selectedTheme: string;
  shareUrl: string;
  imageUrl: string;
}

export class ShareLink extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      useCurrentTimeRange: true,
      useShortUrl: false,
      selectedTheme: 'current',
      shareUrl: '',
      imageUrl: '',
    };
  }

  componentDidMount() {
    reportInteraction('grafana_dashboards_link_share_viewed');
    this.buildUrl();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { useCurrentTimeRange, useShortUrl, selectedTheme } = this.state;
    if (
      prevState.useCurrentTimeRange !== useCurrentTimeRange ||
      prevState.selectedTheme !== selectedTheme ||
      prevState.useShortUrl !== useShortUrl
    ) {
      this.buildUrl();
    }
  }

  buildUrl = async () => {
    const { panel, dashboard } = this.props;
    const { useCurrentTimeRange, useShortUrl, selectedTheme } = this.state;

    const shareUrl = await buildShareUrl(useCurrentTimeRange, selectedTheme, panel, useShortUrl);
    const imageUrl = buildImageUrl(useCurrentTimeRange, dashboard.uid, selectedTheme, panel);

    this.setState({ shareUrl, imageUrl });
  };

  onUseCurrentTimeRangeChange = () => {
    this.setState({ useCurrentTimeRange: !this.state.useCurrentTimeRange });
  };

  onUrlShorten = () => {
    this.setState({ useShortUrl: !this.state.useShortUrl });
  };

  onThemeChange = (value: string) => {
    this.setState({ selectedTheme: value });
  };

  onShareUrlCopy = () => {
    appEvents.emit(AppEvents.alertSuccess, ['Content copied to clipboard']);
  };

  getShareUrl = () => {
    return this.state.shareUrl;
  };

  render() {
    const { panel, dashboard } = this.props;
    const isRelativeTime = dashboard ? dashboard.time.to === 'now' : false;
    const { useCurrentTimeRange, useShortUrl, selectedTheme, shareUrl, imageUrl } = this.state;
    const selectors = e2eSelectors.pages.SharePanelModal;
    const isDashboardSaved = Boolean(dashboard.id);

    const timeRangeLabelTranslation = t({
      id: 'share-modal.link.time-range-label',
      message: `Lock time range`,
    });

    const timeRangeDescriptionTranslation = t({
      id: 'share-modal.link.time-range-description',
      message: `Transforms the current relative time range to an absolute time range`,
    });

    const shortenURLTranslation = t({
      id: 'share-modal.link.shorten-url',
      message: `Shorten URL`,
    });

    const linkURLTranslation = t({
      id: 'share-modal.link.link-url',
      message: `Link URL`,
    });

    return (
      <>
        <p className="share-modal-info-text">
          <Trans id="share-modal.link.info-text">
            Create a direct link to this dashboard or panel, customized with the options below.
          </Trans>
        </p>
        <FieldSet>
          <Field label={timeRangeLabelTranslation} description={isRelativeTime ? timeRangeDescriptionTranslation : ''}>
            <Switch
              id="share-current-time-range"
              value={useCurrentTimeRange}
              onChange={this.onUseCurrentTimeRangeChange}
            />
          </Field>
          <Field label="Theme">
            <RadioButtonGroup options={themeOptions} value={selectedTheme} onChange={this.onThemeChange} />
          </Field>
          <Field label={shortenURLTranslation}>
            <Switch id="share-shorten-url" value={useShortUrl} onChange={this.onUrlShorten} />
          </Field>

          <Field label={linkURLTranslation}>
            <Input
              id="link-url-input"
              value={shareUrl}
              readOnly
              addonAfter={
                <ClipboardButton variant="primary" getText={this.getShareUrl} onClipboardCopy={this.onShareUrlCopy}>
                  <Icon name="copy" />
                  <Trans id="share-modal.link.copy-link-button">Copy</Trans>
                </ClipboardButton>
              }
            />
          </Field>
        </FieldSet>

        {panel && config.rendererAvailable && (
          <>
            {isDashboardSaved && (
              <div className="gf-form">
                <a href={imageUrl} target="_blank" rel="noreferrer" aria-label={selectors.linkToRenderedImage}>
                  <Icon name="camera" />
                  <Trans id="share-modal.link.rendered-image">Direct link rendered image</Trans>
                </a>
              </div>
            )}

            {!isDashboardSaved && (
              <Alert severity="info" title="Dashboard is not saved" bottomSpacing={0}>
                <Trans id="share-modal.link.save-dashboard">
                  To render a panel image, you must save the dashboard first.
                </Trans>
              </Alert>
            )}
          </>
        )}

        {panel && !config.rendererAvailable && (
          <Alert severity="info" title="Image renderer plugin not installed" bottomSpacing={0}>
            <Trans id="share-modal.link.must-install">To render a panel image, you must install the</Trans>
            &nbsp;
            <a
              href="https://grafana.com/grafana/plugins/grafana-image-renderer"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <Trans id="share-modal.link.grafana-plugin">Grafana image renderer plugin</Trans>
            </a>
            <Trans id="share-modal.link.contact-administrator">
              . Please contact your Grafana administrator to install the plugin.
            </Trans>
          </Alert>
        )}
      </>
    );
  }
}
