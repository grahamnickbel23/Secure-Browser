/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        setStudentId: (id: string) => void;
        setExamId: (id: string) => void;
        enterFullScreen: () => void;
        leaveApp: () => void;
    };
}
declare module '*.png' {
    const value: string;
    export default value;
}
declare module '*.jpg' {
    const value: string;
    export default value;
}
declare module '*.jpeg' {
    const value: string;
    export default value;
}
declare module '*.svg' {
    const value: string;
    export default value;
}
declare module '*.gif' {
    const value: string;
    export default value;
}
declare module '*.webp' {
    const value: string;
    export default value;
}
