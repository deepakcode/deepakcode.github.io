import { React, JSX, Routes as RouterRoutes, Route } from '../modules.js';
import ContentPage from './ContentPage.js';
import NotFound from './NotFound.js';

const { jsx, jsxs } = JSX;

const CategoryRedirect = ({ navRegistry, match }) => {
    const { category } = match.params;
    const cat = navRegistry?.categories?.find(c => c.id === category);

    if (cat && cat.defaultPage) {
        return jsx(window.ReactRouterDOM.Redirect, { to: `/${category}/${cat.defaultPage}` });
    }
    return jsx("div", { className: "p-8", children: "Select a topic from the sidebar." });
};

export default function Routes({ categoryData, navRegistry }) {
    return jsxs(RouterRoutes, {
        children: [
            jsx(Route, { path: "/", exact: true, component: () => jsx("div", { className: "p-8", children: "Welcome! Select a topic." }) }),
            jsx(Route, {
                path: "/:category",
                exact: true,
                render: (props) => jsx(CategoryRedirect, { ...props, navRegistry })
            }),
            jsx(Route, {
                path: "/:category/:slug",
                render: (props) => jsx(ContentPage, { ...props, categoryData })
            }),
            jsx(Route, { component: NotFound }),
        ],
    });
}
