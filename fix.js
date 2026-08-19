const fs = require('fs');

const files = [
    'app/components/TimetableMatrixView.tsx',
    'app/components/UnplacedTray.tsx',
    'app/components/PrintPreviewModal.tsx',
    'app/components/LessonCardModal.tsx',
    'app/components/TeacherWorkloadModal.tsx',
    'app/components/TeacherClassAssignmentModal.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace subject?.color with teacher?.color || subject?.color
    // Replace subject?.textColor with teacher?.textColor || subject?.textColor
    // Replace primarySubject.color with teacher?.color || primarySubject.color
    // Replace primarySubject.textColor with teacher?.textColor || primarySubject.textColor

    // We need to be careful with prefixes like det.subject or details.subject
    // We can use a regex with a capture group for the prefix

    content = content.replace(/([a-zA-Z0-9_]*\.)?subject\?\.color/g, (match, p1) => {
        const prefix = p1 || '';
        return `${prefix}teacher?.color || ${prefix}subject?.color`;
    });

    content = content.replace(/([a-zA-Z0-9_]*\.)?subject\?\.textColor/g, (match, p1) => {
        const prefix = p1 || '';
        return `${prefix}teacher?.textColor || ${prefix}subject?.textColor`;
    });

    content = content.replace(/([a-zA-Z0-9_]*\.)?primarySubject\.color/g, (match, p1) => {
        const prefix = p1 || '';
        return `${prefix}teacher?.color || ${prefix}primarySubject.color`;
    });

    content = content.replace(/([a-zA-Z0-9_]*\.)?primarySubject\.textColor/g, (match, p1) => {
        const prefix = p1 || '';
        return `${prefix}teacher?.textColor || ${prefix}primarySubject.textColor`;
    });

    fs.writeFileSync(file, content);
});
console.log('Fix applied successfully.');
