export function generateId(label) {
    return label + "_" + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}