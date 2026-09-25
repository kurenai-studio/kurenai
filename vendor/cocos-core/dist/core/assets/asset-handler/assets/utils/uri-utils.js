"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertsEncodedSeparatorsInURI = convertsEncodedSeparatorsInURI;
function convertsEncodedSeparatorsInURI(uri) {
    let hasBackSlash = false;
    const segments = uri
        .pathname()
        .split('/')
        .map((x) => {
        const subsegs = decodeURIComponent(x).split(/[\\\/]/g); // eslint-disable-line no-useless-escape
        if (subsegs.length > 1) {
            hasBackSlash = true;
            return subsegs.map((subseg) => encodeURIComponent(subseg)).join('/');
        }
        else {
            return x;
        }
    });
    if (hasBackSlash) {
        uri.pathname(segments.join('/'));
    }
    return uri;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvYXNzZXRzL2Fzc2V0LWhhbmRsZXIvYXNzZXRzL3V0aWxzL3VyaS11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLHdFQWtCQztBQWxCRCxTQUFnQiw4QkFBOEIsQ0FBQyxHQUFRO0lBQ25ELElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztJQUN6QixNQUFNLFFBQVEsR0FBRyxHQUFHO1NBQ2YsUUFBUSxFQUFFO1NBQ1YsS0FBSyxDQUFDLEdBQUcsQ0FBQztTQUNWLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFO1FBQ2YsTUFBTSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsd0NBQXdDO1FBQ2hHLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNyQixZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekUsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsQ0FBQztRQUNiLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLElBQUksWUFBWSxFQUFFLENBQUM7UUFDZixHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFVSSSBmcm9tICd1cmlqcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0c0VuY29kZWRTZXBhcmF0b3JzSW5VUkkodXJpOiBVUkkpIHtcbiAgICBsZXQgaGFzQmFja1NsYXNoID0gZmFsc2U7XG4gICAgY29uc3Qgc2VnbWVudHMgPSB1cmlcbiAgICAgICAgLnBhdGhuYW1lKClcbiAgICAgICAgLnNwbGl0KCcvJylcbiAgICAgICAgLm1hcCgoeDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdWJzZWdzID0gZGVjb2RlVVJJQ29tcG9uZW50KHgpLnNwbGl0KC9bXFxcXFxcL10vZyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdXNlbGVzcy1lc2NhcGVcbiAgICAgICAgICAgIGlmIChzdWJzZWdzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBoYXNCYWNrU2xhc2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzZWdzLm1hcCgoc3Vic2VnKSA9PiBlbmNvZGVVUklDb21wb25lbnQoc3Vic2VnKSkuam9pbignLycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgaWYgKGhhc0JhY2tTbGFzaCkge1xuICAgICAgICB1cmkucGF0aG5hbWUoc2VnbWVudHMuam9pbignLycpKTtcbiAgICB9XG4gICAgcmV0dXJuIHVyaTtcbn1cbiJdfQ==