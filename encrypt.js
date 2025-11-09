// Base64 encoded text map to make content less obvious
const encodedTextMap = {
    'text-1': 'Q29uZmlybSBQdXJjaGFzZQ==',
    'text-11': 'MS4gT3BlcmF0aW9uYWwgQ29udHJvbHM=',
    'text-12': 'Mi4gUHJlLVN0YXJ0IFNhZmV0eSBDaGVja3MgKEFsbCBib3hlcyBtdXN0IGJlIGNoZWNrZWQgYmVmb3JlIHByb2NlZWRpbmcp',
    'text-13': 'TG9ja291dC9UYWdvdXQgZGV2aWNlcyByZW1vdmVk',
    'text-14': 'VmVyaWZ5IGFsbCBtYWludGVuYW5jZSBsb2NrcyBhcmUgY2xlYXJlZCBhbmQgdGhlIGxvZ2Jvb2sgaXMgc2lnbmVkIG9mZi4=',
    'text-15': 'R3VhcmRpbmcgYW5kIGJhcnJpZXJzIGluIHBsYWNl',
    'text-16': 'SW5zcGVjdCBjYWdlIGRvb3JzLCBsYXNlciBjdXJ0YWlucywgYW5kIGludGVybG9ja3MgZm9yIHRhbXBlcmluZyBvciBkYW1hZ2Uu',
    'text-17': 'RW1lcmdlbmN5IHN0b3AgYnV0dG9ucyB0ZXN0ZWQ=',
    'text-18': 'RW5zdXJlIGFsbCBlLXN0b3AgYnV0dG9ucyBsYXRjaCBhbmQgcmVzZXQgY29ycmVjdGx5IGFsb25nIHRoZSBjb252ZXlvci4=',
    'text-19': 'Q29tcHJlc3NlZCBhaXIgbGluZXMgaW5zcGVjdGVk',
    'text-20': 'Q2hlY2sgZm9yIGxlYWtzLCB0cmlwIGhhemFyZHMsIGFuZCB0aGF0IHJlZ3VsYXRvcnMgYXJlIHNldCB0byBhcHByb3ZlZCBQU0ku',
    'text-21': 'TmFtZSBvbiBDYXJk',
    'text-22': 'Q2FyZCBOdW1iZXI=',
    'text-30': '8J+MkCBHUFQtNSByZXByZXNlbnRzIGFuICoqdW5wcmVjZWRlbnRlZCBsZWFwKiogaW4gQUksIGxldmVyYWdpbmcgaXRzIG1hc3NpdmUgKipzY2FsZSoqIGFuZCBzb3BoaXN0aWNhdGVkICoqdHJhbnNmb3JtZXIgYXJjaGl0ZWN0dXJlKiogdG8gcHJvZHVjZSByZW1hcmthYmx5ICoqY29oZXJlbnQgYW5kIGNvbnRleHR1YWxseSBhd2FyZSoqIG91dHB1dHMuIFRoaXMgbW9kZWwgZXhjZWxzIGF0IHN5bnRoZXNpemluZyBjb21wbGV4IGluZm9ybWF0aW9uIGFuZCBoYW5kbGluZyBpbnRyaWNhdGUsIG11bHRpLXN0ZXAgaW5zdHJ1Y3Rpb25zLCBzZXR0aW5nIGEgbmV3LCBoaWdoZXIgc3RhbmRhcmQgZm9yICoqaHVtYW4tbGlrZSB1bmRlcnN0YW5kaW5nIGFuZCBnZW5lcmF0aW9uKiogYWNyb3NzIGFueSB0YXNrIGltYWdpbmFibGUu',
    // Add more id-to-text pairs as needed
};

// Decode base64 string
function decodeText(encoded) {
    try {
        return atob(encoded);
    } catch (e) {
        console.error('Failed to decode text:', e);
        return '';
    }
}

function applyEncryptedText(map = encodedTextMap) {
    Object.entries(map).forEach(([id, encodedText]) => {
        const el = document.getElementById(id);
        if (el) {
            const decodedText = decodeText(encodedText);
            el.textContent = decodedText;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => applyEncryptedText());

// Optionally expose functions to window for debugging
// Comment out these lines in production
// window.applyEncryptedText = applyEncryptedText;
// window.encodedTextMap = encodedTextMap;
