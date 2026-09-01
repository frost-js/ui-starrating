const $ = globalThis.$;
const UI = globalThis.UI;

const setTheme = (theme) => {
    if (theme === 'system') {
        $(document.documentElement).removeAttribute('data-ui-theme');
    } else {
        $(document.documentElement).setAttribute('data-ui-theme', theme);
    }

    $('[data-demo-theme]').setValue(theme);
};

const storedTheme = localStorage.getItem('frostui-starrating-demo-theme');
setTheme(['light', 'dark'].includes(storedTheme) ? storedTheme : 'system');

$.ready(() => {
    const apiInput = $.findOne('#api-rating');
    const eventLog = $.findOne('#event-log');

    const report = (message, className = 'text-body-secondary') => {
        const item = $.create('li', {
            class: [
                'list-group-item',
                className,
            ],
            text: `${new Date().toLocaleTimeString()} — ${message}`,
        });

        eventLog.prepend(item);

        while (eventLog.childElementCount > 10) {
            eventLog.lastElementChild.remove();
        }
    };

    const getApiComponent = () => {
        const component = $.getData(apiInput, 'starrating');

        if (!component) {
            report('The method target is disposed. Select Reinitialize first.', 'text-danger');
            return null;
        }

        return component;
    };

    $('[data-ui-toggle="starrating"]').starrating();

    apiInput.addEventListener('change', (event) => {
        const namespace = event.namespace || 'native';
        report(
            `change.${namespace}: value is ${apiInput.value}.`,
            'text-primary',
        );
    });

    $('[data-demo-theme]').addEvent('change', (event) => {
        const theme = $.getValue(event.currentTarget);

        if (theme === 'system') {
            localStorage.removeItem('frostui-starrating-demo-theme');
        } else {
            localStorage.setItem('frostui-starrating-demo-theme', theme);
        }

        setTheme(theme);
    });

    $('[data-demo-action]').addEvent('click', (event) => {
        const action = $.getDataset(event.currentTarget, 'demoAction');

        switch (action) {
            case 'set': {
                const component = getApiComponent();

                if (!component) {
                    break;
                }

                const value = Number($.getDataset(event.currentTarget, 'demoValue'));
                component.setValue(value);
                report(`setValue(${value}) completed with ${component.getValue()}.`);
                break;
            }
            case 'get': {
                const component = getApiComponent();

                if (component) {
                    report(`getValue() returned ${component.getValue()}.`);
                }

                break;
            }
            case 'disable': {
                const component = getApiComponent();

                if (component) {
                    component.disable();
                    report('disable() made the slider unavailable and unfocusable.');
                }

                break;
            }
            case 'enable': {
                const component = getApiComponent();

                if (component) {
                    component.enable();
                    report('enable() restored slider interaction.', 'text-success');
                }

                break;
            }
            case 'dispose': {
                const component = getApiComponent();

                if (component) {
                    component.dispose();
                    report('dispose() removed the generated slider and restored the input.', 'text-danger');
                }

                break;
            }
            case 'init': {
                const existing = $.getData(apiInput, 'starrating');
                const component = UI.StarRating.init(apiInput);
                report(
                    existing ?
                        'init() returned the existing instance.' :
                        `init() created a new instance with value ${component.getValue()}.`,
                    'text-success',
                );
                break;
            }
            case 'clear':
                eventLog.replaceChildren();
                report('Log cleared.');
                break;
        }
    });

    setTheme(document.documentElement.dataset.uiTheme || 'system');
});
