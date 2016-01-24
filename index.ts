import {IncomingMessage, ServerResponse} from 'http';
import {Props, ComponentClass, StatelessComponent, createElement} from 'react';
// ReactDOMServer docs: https://facebook.github.io/react/docs/top-level-api.html#reactdomserver
import {renderToString, renderToStaticMarkup} from 'react-dom/server';

/**
A generic version of the standard React.ReactType type (which is also a union).
*/
export type ReactType<P extends Props<any>> = string | ComponentClass<P> | StatelessComponent<P>;

const _layoutPlaceholder = '#yield#';

export function renderReact<P extends Props<any>>(type: ReactType<P>,
                                                  props?: P,
                                                  layoutType?: ReactType<P>): string {
  // we have to render these separately since we only replace the component
  // part from the browser
  // TODO: get TypeScript to support type union variance across the overloaded
  // createElement definitions (the <any> assertion is because TypeScript can't
  // handle this right now)
  const element = createElement<P>(<any>type, props);
  let html = renderToString(element);
  // TODO: figure out a better way to inject the child component contents into
  // the layout component instead of this _layoutPlaceholder hack
  if (layoutType) {
    const layoutElement = createElement<P>(<any>layoutType, props, _layoutPlaceholder);
    const layoutHtml = renderToStaticMarkup(layoutElement);
    html = layoutHtml.replace(_layoutPlaceholder, html);
  }
  return '<!DOCTYPE html>' + html;
}

export interface Payload<P> {
  statusCode?: number;
  headers?: [string, string][];
  props?: P;
  xhr?: boolean;
  Component?: ReactType<P>;
  LayoutComponent?: ReactType<P>;
  stream?: NodeJS.ReadableStream;
}

/**
Given a response payload, take the following steps:

1. Set the response statusCode to the given statusCode or 200 if not specified.
2. Add the specified headers, if any.
3. If there is a stream, pipe it to the response.
4. Otherwise, if there is a Component and xhr is not set, render the component
  as HTML (wrapped in the LayoutComponent, if provided).
5. Otherwise, if there are props, JSON.stringify them.
6. Otherwise, simply end the response with no data.
*/
function respond<P>(res: ServerResponse, payload: Payload<P> = {}) {
  // export function send<P>(callback: () => void) {
  res.statusCode = payload.statusCode || 200;
  if (payload.headers) {
    payload.headers.forEach(([name, value]) => res.setHeader(name, value));
  }

  if (payload.stream) {
    payload.stream.pipe(res);
  }
  // if
  else if (!payload.xhr && payload.Component) {
    res.setHeader('Content-Type', 'text/html');
    const html = renderReact(payload.Component, payload.props, payload.LayoutComponent);
    res.end(html);
  }
  else if (payload.props) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload.props));
  }
  else {
    res.end();
  }
}

export default respond;
