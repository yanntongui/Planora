
import { EducationalResource, GlossaryTerm } from '../types';

export const RESOURCES: EducationalResource[] = [
    {
        id: 'basics-budget-101',
        titleKey: 'education.basics.budget101.title',
        descriptionKey: 'education.basics.budget101.desc',
        contentKey: 'education.basics.budget101.content',
        category: 'budgeting',
        level: 'beginner',
        readTimeMinutes: 3,
        actionCommand: 'start monthly budget'
    },
    {
        id: 'basics-emergency-fund',
        titleKey: 'education.saving.emergency.title',
        descriptionKey: 'education.saving.emergency.desc',
        contentKey: 'education.saving.emergency.content',
        category: 'saving',
        level: 'beginner',
        readTimeMinutes: 4,
        actionCommand: 'create goal "Emergency Fund" 1000'
    },
    {
        id: 'debt-snowball',
        titleKey: 'education.debt.snowball.title',
        descriptionKey: 'education.debt.snowball.desc',
        contentKey: 'education.debt.snowball.content',
        category: 'debt',
        level: 'intermediate',
        readTimeMinutes: 5,
        actionCommand: 'debt'
    },
    {
        id: 'events-wedding',
        titleKey: 'education.events.wedding.title',
        descriptionKey: 'education.events.wedding.desc',
        contentKey: 'education.events.wedding.content',
        category: 'events',
        level: 'intermediate',
        readTimeMinutes: 6,
        actionCommand: 'budget Wedding 15000'
    },
    {
        id: 'psychology-impulse',
        titleKey: 'education.psych.impulse.title',
        descriptionKey: 'education.psych.impulse.desc',
        contentKey: 'education.psych.impulse.content',
        category: 'psychology',
        level: 'beginner',
        readTimeMinutes: 3,
        actionCommand: 'rule 50/30/20'
    }
];

export const GLOSSARY: GlossaryTerm[] = [
    { termKey: 'glossary.apr.term', definitionKey: 'glossary.apr.def' },
    { termKey: 'glossary.asset.term', definitionKey: 'glossary.asset.def' },
    { termKey: 'glossary.compound.term', definitionKey: 'glossary.compound.def' },
    { termKey: 'glossary.inflation.term', definitionKey: 'glossary.inflation.def' },
    { termKey: 'glossary.liability.term', definitionKey: 'glossary.liability.def' },
    { termKey: 'glossary.networth.term', definitionKey: 'glossary.networth.def' },
    { termKey: 'glossary.zerobased.term', definitionKey: 'glossary.zerobased.def' },
];

export const PATHS = [
    {
        id: 'path-stability',
        titleKey: 'education.path.stability.title',
        descKey: 'education.path.stability.desc',
        resources: ['basics-budget-101', 'basics-emergency-fund', 'psychology-impulse']
    },
    {
        id: 'path-debt-free',
        titleKey: 'education.path.debtfree.title',
        descKey: 'education.path.debtfree.desc',
        resources: ['basics-budget-101', 'debt-snowball']
    }
];
