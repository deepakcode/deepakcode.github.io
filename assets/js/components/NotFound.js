import { JSX } from '../modules.js';
const InternalNotFound = window.EasyInterviewInternals?.Components?.NotFound;

export default function NotFound() {
    const { jsx } = JSX;
    return InternalNotFound ? jsx(InternalNotFound, {}) : jsx("div", { children: "404 Not Found" });
}
