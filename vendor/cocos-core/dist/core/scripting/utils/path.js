"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbURLRoot = void 0;
exports.resolveFileName = resolveFileName;
exports.toLowerCase = toLowerCase;
exports.removeTSExt = removeTSExt;
exports.toFileNameLowerCase = toFileNameLowerCase;
exports.isPathEqual = isPathEqual;
exports.getDbName = getDbName;
function resolveFileName(path) {
    return path.replace(/\\/g, '/');
}
/** Returns lower case string */
function toLowerCase(x) {
    return x.toLowerCase();
}
function removeTSExt(path) {
    return path.replace(/(\.d)?.ts$/, '');
}
// We convert the file names to lower case as key for file name on case insensitive file system
// While doing so we need to handle special characters (eg \u0130) to ensure that we dont convert
// it to lower case, fileName with its lowercase form can exist along side it.
// Handle special characters and make those case sensitive instead
//
// |-#--|-Unicode--|-Char code-|-Desc-------------------------------------------------------------------|
// | 1. | i        | 105       | Ascii i                                                                |
// | 2. | I        | 73        | Ascii I                                                                |
// |-------- Special characters ------------------------------------------------------------------------|
// | 3. | \u0130   | 304       | Upper case I with dot above                                            |
// | 4. | i,\u0307 | 105,775   | i, followed by 775: Lower case of (3rd item)                           |
// | 5. | I,\u0307 | 73,775    | I, followed by 775: Upper case of (4th item), lower case is (4th item) |
// | 6. | \u0131   | 305       | Lower case i without dot, upper case is I (2nd item)                   |
// | 7. | \u00DF   | 223       | Lower case sharp s                                                     |
//
// Because item 3 is special where in its lowercase character has its own
// upper case form we cant convert its case.
// Rest special characters are either already in lower case format or
// they have corresponding upper case character so they dont need special handling
//
// But to avoid having to do string building for most common cases, also ignore
// a-z, 0-9, \u0131, \u00DF, \, /, ., : and space
const fileNameLowerCaseRegExp = /[^\u0130\u0131\u00DFa-z0-9\\/:\-_\. ]+/g;
/**
 * Case insensitive file systems have descripencies in how they handle some characters (eg. turkish Upper case I with dot on top - \u0130)
 * This function is used in places where we want to make file name as a key on these systems
 * It is possible on mac to be able to refer to file name with I with dot on top as a fileName with its lower case form
 * But on windows we cannot. Windows can have fileName with I with dot on top next to its lower case and they can not each be referred with the lowercase forms
 * Technically we would want this function to be platform sepcific as well but
 * our api has till now only taken caseSensitive as the only input and just for some characters we dont want to update API and ensure all customers use those api
 * We could use upper case and we would still need to deal with the descripencies but
 * we want to continue using lower case since in most cases filenames are lowercasewe and wont need any case changes and avoid having to store another string for the key
 * So for this function purpose, we go ahead and assume character I with dot on top it as case sensitive since its very unlikely to use lower case form of that special character
 */
function toFileNameLowerCase(x) {
    return fileNameLowerCaseRegExp.test(x) ?
        x.replace(fileNameLowerCaseRegExp, toLowerCase) :
        x;
}
function isPathEqual(a, b) {
    return toFileNameLowerCase(a) === toFileNameLowerCase(b);
}
const reg = /^db:\/\/(.*?)\//;
function getDbName(dbURL) {
    return reg.exec(dbURL)?.[1];
}
exports.dbURLRoot = 'db://';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL3NjcmlwdGluZy91dGlscy9wYXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDBDQUVDO0FBR0Qsa0NBRUM7QUFFRCxrQ0FFQztBQW1DRCxrREFJQztBQUNELGtDQUVDO0FBRUQsOEJBRUM7QUF6REQsU0FBZ0IsZUFBZSxDQUFDLElBQVk7SUFDeEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQsZ0NBQWdDO0FBQ2hDLFNBQWdCLFdBQVcsQ0FBQyxDQUFTO0lBQ2pDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFnQixXQUFXLENBQUMsSUFBWTtJQUNwQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFDRCwrRkFBK0Y7QUFDL0YsaUdBQWlHO0FBQ2pHLDhFQUE4RTtBQUM5RSxrRUFBa0U7QUFDbEUsRUFBRTtBQUNGLHlHQUF5RztBQUN6Ryx5R0FBeUc7QUFDekcseUdBQXlHO0FBQ3pHLHlHQUF5RztBQUN6Ryx5R0FBeUc7QUFDekcseUdBQXlHO0FBQ3pHLHlHQUF5RztBQUN6Ryx5R0FBeUc7QUFDekcseUdBQXlHO0FBQ3pHLEVBQUU7QUFDRix5RUFBeUU7QUFDekUsNENBQTRDO0FBQzVDLHFFQUFxRTtBQUNyRSxrRkFBa0Y7QUFDbEYsRUFBRTtBQUNGLCtFQUErRTtBQUMvRSxpREFBaUQ7QUFDakQsTUFBTSx1QkFBdUIsR0FBRyx5Q0FBeUMsQ0FBQztBQUMxRTs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsQ0FBUztJQUN6QyxPQUFPLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUM7QUFDVixDQUFDO0FBQ0QsU0FBZ0IsV0FBVyxDQUFDLENBQVMsRUFBRSxDQUFTO0lBQzVDLE9BQU8sbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEtBQUssbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQztBQUNELE1BQU0sR0FBRyxHQUFHLGlCQUFpQixDQUFDO0FBQzlCLFNBQWdCLFNBQVMsQ0FBQyxLQUFhO0lBQ25DLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFFWSxRQUFBLFNBQVMsR0FBRyxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRmlsZU5hbWUocGF0aDogc3RyaW5nKXtcbiAgICByZXR1cm4gcGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG59XG5cbi8qKiBSZXR1cm5zIGxvd2VyIGNhc2Ugc3RyaW5nICovXG5leHBvcnQgZnVuY3Rpb24gdG9Mb3dlckNhc2UoeDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHgudG9Mb3dlckNhc2UoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVRTRXh0KHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvKFxcLmQpPy50cyQvLCAnJyk7XG59XG4vLyBXZSBjb252ZXJ0IHRoZSBmaWxlIG5hbWVzIHRvIGxvd2VyIGNhc2UgYXMga2V5IGZvciBmaWxlIG5hbWUgb24gY2FzZSBpbnNlbnNpdGl2ZSBmaWxlIHN5c3RlbVxuLy8gV2hpbGUgZG9pbmcgc28gd2UgbmVlZCB0byBoYW5kbGUgc3BlY2lhbCBjaGFyYWN0ZXJzIChlZyBcXHUwMTMwKSB0byBlbnN1cmUgdGhhdCB3ZSBkb250IGNvbnZlcnRcbi8vIGl0IHRvIGxvd2VyIGNhc2UsIGZpbGVOYW1lIHdpdGggaXRzIGxvd2VyY2FzZSBmb3JtIGNhbiBleGlzdCBhbG9uZyBzaWRlIGl0LlxuLy8gSGFuZGxlIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgbWFrZSB0aG9zZSBjYXNlIHNlbnNpdGl2ZSBpbnN0ZWFkXG4vL1xuLy8gfC0jLS18LVVuaWNvZGUtLXwtQ2hhciBjb2RlLXwtRGVzYy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4vLyB8IDEuIHwgaSAgICAgICAgfCAxMDUgICAgICAgfCBBc2NpaSBpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbi8vIHwgMi4gfCBJICAgICAgICB8IDczICAgICAgICB8IEFzY2lpIEkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuLy8gfC0tLS0tLS0tIFNwZWNpYWwgY2hhcmFjdGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4vLyB8IDMuIHwgXFx1MDEzMCAgIHwgMzA0ICAgICAgIHwgVXBwZXIgY2FzZSBJIHdpdGggZG90IGFib3ZlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4vLyB8IDQuIHwgaSxcXHUwMzA3IHwgMTA1LDc3NSAgIHwgaSwgZm9sbG93ZWQgYnkgNzc1OiBMb3dlciBjYXNlIG9mICgzcmQgaXRlbSkgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4vLyB8IDUuIHwgSSxcXHUwMzA3IHwgNzMsNzc1ICAgIHwgSSwgZm9sbG93ZWQgYnkgNzc1OiBVcHBlciBjYXNlIG9mICg0dGggaXRlbSksIGxvd2VyIGNhc2UgaXMgKDR0aCBpdGVtKSB8XG4vLyB8IDYuIHwgXFx1MDEzMSAgIHwgMzA1ICAgICAgIHwgTG93ZXIgY2FzZSBpIHdpdGhvdXQgZG90LCB1cHBlciBjYXNlIGlzIEkgKDJuZCBpdGVtKSAgICAgICAgICAgICAgICAgICB8XG4vLyB8IDcuIHwgXFx1MDBERiAgIHwgMjIzICAgICAgIHwgTG93ZXIgY2FzZSBzaGFycCBzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4vL1xuLy8gQmVjYXVzZSBpdGVtIDMgaXMgc3BlY2lhbCB3aGVyZSBpbiBpdHMgbG93ZXJjYXNlIGNoYXJhY3RlciBoYXMgaXRzIG93blxuLy8gdXBwZXIgY2FzZSBmb3JtIHdlIGNhbnQgY29udmVydCBpdHMgY2FzZS5cbi8vIFJlc3Qgc3BlY2lhbCBjaGFyYWN0ZXJzIGFyZSBlaXRoZXIgYWxyZWFkeSBpbiBsb3dlciBjYXNlIGZvcm1hdCBvclxuLy8gdGhleSBoYXZlIGNvcnJlc3BvbmRpbmcgdXBwZXIgY2FzZSBjaGFyYWN0ZXIgc28gdGhleSBkb250IG5lZWQgc3BlY2lhbCBoYW5kbGluZ1xuLy9cbi8vIEJ1dCB0byBhdm9pZCBoYXZpbmcgdG8gZG8gc3RyaW5nIGJ1aWxkaW5nIGZvciBtb3N0IGNvbW1vbiBjYXNlcywgYWxzbyBpZ25vcmVcbi8vIGEteiwgMC05LCBcXHUwMTMxLCBcXHUwMERGLCBcXCwgLywgLiwgOiBhbmQgc3BhY2VcbmNvbnN0IGZpbGVOYW1lTG93ZXJDYXNlUmVnRXhwID0gL1teXFx1MDEzMFxcdTAxMzFcXHUwMERGYS16MC05XFxcXC86XFwtX1xcLiBdKy9nO1xuLyoqXG4gKiBDYXNlIGluc2Vuc2l0aXZlIGZpbGUgc3lzdGVtcyBoYXZlIGRlc2NyaXBlbmNpZXMgaW4gaG93IHRoZXkgaGFuZGxlIHNvbWUgY2hhcmFjdGVycyAoZWcuIHR1cmtpc2ggVXBwZXIgY2FzZSBJIHdpdGggZG90IG9uIHRvcCAtIFxcdTAxMzApXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgaW4gcGxhY2VzIHdoZXJlIHdlIHdhbnQgdG8gbWFrZSBmaWxlIG5hbWUgYXMgYSBrZXkgb24gdGhlc2Ugc3lzdGVtc1xuICogSXQgaXMgcG9zc2libGUgb24gbWFjIHRvIGJlIGFibGUgdG8gcmVmZXIgdG8gZmlsZSBuYW1lIHdpdGggSSB3aXRoIGRvdCBvbiB0b3AgYXMgYSBmaWxlTmFtZSB3aXRoIGl0cyBsb3dlciBjYXNlIGZvcm1cbiAqIEJ1dCBvbiB3aW5kb3dzIHdlIGNhbm5vdC4gV2luZG93cyBjYW4gaGF2ZSBmaWxlTmFtZSB3aXRoIEkgd2l0aCBkb3Qgb24gdG9wIG5leHQgdG8gaXRzIGxvd2VyIGNhc2UgYW5kIHRoZXkgY2FuIG5vdCBlYWNoIGJlIHJlZmVycmVkIHdpdGggdGhlIGxvd2VyY2FzZSBmb3Jtc1xuICogVGVjaG5pY2FsbHkgd2Ugd291bGQgd2FudCB0aGlzIGZ1bmN0aW9uIHRvIGJlIHBsYXRmb3JtIHNlcGNpZmljIGFzIHdlbGwgYnV0XG4gKiBvdXIgYXBpIGhhcyB0aWxsIG5vdyBvbmx5IHRha2VuIGNhc2VTZW5zaXRpdmUgYXMgdGhlIG9ubHkgaW5wdXQgYW5kIGp1c3QgZm9yIHNvbWUgY2hhcmFjdGVycyB3ZSBkb250IHdhbnQgdG8gdXBkYXRlIEFQSSBhbmQgZW5zdXJlIGFsbCBjdXN0b21lcnMgdXNlIHRob3NlIGFwaVxuICogV2UgY291bGQgdXNlIHVwcGVyIGNhc2UgYW5kIHdlIHdvdWxkIHN0aWxsIG5lZWQgdG8gZGVhbCB3aXRoIHRoZSBkZXNjcmlwZW5jaWVzIGJ1dFxuICogd2Ugd2FudCB0byBjb250aW51ZSB1c2luZyBsb3dlciBjYXNlIHNpbmNlIGluIG1vc3QgY2FzZXMgZmlsZW5hbWVzIGFyZSBsb3dlcmNhc2V3ZSBhbmQgd29udCBuZWVkIGFueSBjYXNlIGNoYW5nZXMgYW5kIGF2b2lkIGhhdmluZyB0byBzdG9yZSBhbm90aGVyIHN0cmluZyBmb3IgdGhlIGtleVxuICogU28gZm9yIHRoaXMgZnVuY3Rpb24gcHVycG9zZSwgd2UgZ28gYWhlYWQgYW5kIGFzc3VtZSBjaGFyYWN0ZXIgSSB3aXRoIGRvdCBvbiB0b3AgaXQgYXMgY2FzZSBzZW5zaXRpdmUgc2luY2UgaXRzIHZlcnkgdW5saWtlbHkgdG8gdXNlIGxvd2VyIGNhc2UgZm9ybSBvZiB0aGF0IHNwZWNpYWwgY2hhcmFjdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0ZpbGVOYW1lTG93ZXJDYXNlKHg6IHN0cmluZykge1xuICAgIHJldHVybiBmaWxlTmFtZUxvd2VyQ2FzZVJlZ0V4cC50ZXN0KHgpID9cbiAgICAgICAgeC5yZXBsYWNlKGZpbGVOYW1lTG93ZXJDYXNlUmVnRXhwLCB0b0xvd2VyQ2FzZSkgOlxuICAgICAgICB4O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzUGF0aEVxdWFsKGE6IHN0cmluZywgYjogc3RyaW5nKXtcbiAgICByZXR1cm4gdG9GaWxlTmFtZUxvd2VyQ2FzZShhKSA9PT0gdG9GaWxlTmFtZUxvd2VyQ2FzZShiKTtcbn1cbmNvbnN0IHJlZyA9IC9eZGI6XFwvXFwvKC4qPylcXC8vO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERiTmFtZShkYlVSTDogc3RyaW5nKXtcbiAgICByZXR1cm4gcmVnLmV4ZWMoZGJVUkwpPy5bMV07XG59XG5cbmV4cG9ydCBjb25zdCBkYlVSTFJvb3QgPSAnZGI6Ly8nO1xuIl19