export type ServiceCategory = "External Services" | "Internal Services";

export interface OfficeServices {
    [transactionType: string]: {
        [category in ServiceCategory]?: string[];
    };
}

export const servicesData: Record<string, OfficeServices> = {
    "TESDA PO DS": {
        "Assessment and Certification": {
            "External Services": [
                "Application for Assessment and Certification",
                "Accreditation of New Competency Assessors",
                "Accreditation of Competency Assessment Centers",
                "Issuance of Certification for Authentication and Verification (CAV) of Scholastic Records",
                "Issuance of Certified True Copy (CTC) of National Certificate (NC)/ Certificate of Competency (CoC)",
                "Issuance of E-Certification (NC/COC)",
                "Issuance of National TVET Trainer Certificate",
                "Issuance of NC Plastic Card",
                "Issuance of Special Order (SO)",
                "Renewal of Competency Assessor’s Accreditation",
                "Renewal of National Certificate/ Certificate of Competency",
                "Replacement of Damaged National Certificate/Certificate of Competency",
                "Replacement of Lost National Certificate and Certificate of Competency",
                "Replacement of National Certificate and Certificate of Competency due to Change of Name",
                "Replacement of NC/COC due to Erroneous Entry",
            ],
        },
        "Program Registration": {
            "External Services": [
                "Online Processing of Program Registration Application",
                "Preparation of Provincial Qualification Map",
                "Program Registration",
            ],
        },
        "Training": {
            "External Services": [
                "Conduct of Training Induction Program (TIP)",
            ],
        },
        "Scholarship": {
            "External Services": [
                "Availment of Scholarship Programs (Face to Face)",
                "Availment of Scholarship Programs (Online)",
            ],
        },
        "Administrative": {
            "External Services": [
                "Payment of Scholarship Vouchers For Client",
                "Payment of Training Support Fund-Last Tranche",
            ],
            "Internal Services": [
                "Payment of Scholarship Vouchers For Staff",
                "Issuance of Supplies Available on Stock",
                "Procurement of Supplies, Equipment and Services",
            ],
        },
        "Others": {
            "External Services": [
                "Complaints Handling",
                "Customer Inquiry and Feedback Through Calls",
                "Customer Inquiry and Feedback Through Calls with concerned Office",
                "Customer Inquiry and Feedback Through Public Assistance and Complaint Desk",
                "Customer Inquiry and Feedback Through Public Assistance and Complaint Desk with concerned Office",
                "Customer Inquiry and Feedback Through SMS and Electronic mails",
                "Customer Inquiry and Feedback Through SMS and Electronic mails with concerned Office",
                "Release of Starter Toolkits",
            ],
        },
    },
    "CCNTS": {
        "Assessment and Certification": {
            "External Services": [
                "Conduct of Assessment and Certification",
                "Issuance of Certificate of Training",
                "Issuance of Transcript of Records",
            ],
        },
        "Program Registration": {
            "External Services": [
                "Online Processing of Program Registration Application",
            ],
        },
        "Training": {
            "External Services": [
                "Application for Training (Diploma Program)",
                "Conduct of Training Induction Program (TIP)",
            ],
        },
        "Scholarship": {
            "External Services": [
                "Application for Scholarship and Enrolment Procedures",
            ],
        },

        "Administrative": {
            "External Services": [
                "Dormitory Services",
            ],
            "Internal Services": [
                "Dormitory Services",
                "Issuance of Supplies Available on Stock",
                "Procurement of Supplies, Equipment and Services",
            ],
        },
    },
    "PTC - DS": {
        "Assessment and Certification": {
            "External Services": [
                "Conduct of Assessment",
                "Issuance of Certificate of Training",
                "Issuance of Transcript of Records",
            ],
        },
        "Program Registration": {
            "External Services": [
                "Application for Scholarship and Enrolment",
                "Availment of Scholarship Program",
            ],
        },
        "Training": {
            "External Services": [
                "Application for Training (Diploma Program)",
                "Conduct of Training Induction Program (TIP)",
            ],
        },
        "Scholarship": {
            "External Services": [
                "Application for Scholarship and Enrolment Procedures",
            ],
        },
        "Administrative": {
            "External Services": [
                "Dormitory Services",
            ],
            "Internal Services": [
                "Catering Services",
                "Day Care Services",
                "Dormitory Services",
                "Issuance of Supplies Available on Stock",
                "Procurement of Supplies, Equipment and Services",
                "Rental of Function Room",
            ],
        },
        "Others": {
            "External Services": [
                "Catering Services",
                "Customer Inquiry and Feedback Through Calls",
                "Customer Inquiry and Feedback Through Calls with concerned Office",
                "Customer Inquiry and Feedback Through Public Assistance and Complaint Desk",
                "Customer Inquiry and Feedback Through Public Assistance and Complaint Desk with concerned Office",
                "Customer Inquiry and Feedback Through SMS and Electronic mails",
                "Customer Inquiry and Feedback Through SMS and Electronic mails with concerned Office",
            ],
            "Internal Services": [
                "Catering Services",
                "Day Care Services",
                "Dormitory Services",
                "Issuance of Supplies Available on Stock",
                "Procurement of Supplies, Equipment and Services",
                "Rental of Function Room",
            ],
        },

    },
};

export const exactServiceCategoryMap: Record<string, ServiceCategory> = {
    "Application for Assessment and Certification": "External Services",
    "Accreditation of New Competency Assessors": "External Services",
    "Accreditation of Competency Assessment Centers": "External Services",
    "Availment of Scholarship Programs (Face to Face)": "External Services",
    "Availment of Scholarship Programs (Online)": "External Services",
    "Complaints Handling": "External Services",
    "Conduct of Training Induction Program (TIP)": "External Services",
    "Customer Inquiry and Feedback Through Calls": "External Services",
    "Customer Inquiry and Feedback Through Calls with concerned Office": "External Services",
    "Customer Inquiry and Feedback Through Public Assistance and Complaint Desk": "External Services",
    "Customer Inquiry and Feedback Through Public Assistance and Complaint Desk with concerned Office": "External Services",
    "Customer Inquiry and Feedback Through SMS and Electronic mails": "External Services",
    "Customer Inquiry and Feedback Through SMS and Electronic mails with concerned Office": "External Services",
    "Issuance of Certification for Authentication and Verification (CAV) of Scholastic Records": "External Services",
    "Issuance of Certified True Copy (CTC) of National Certificate (NC)/ Certificate of Competency (CoC)": "External Services",
    "Issuance of E-Certification (NC/COC)": "External Services",
    "Issuance of National TVET Trainer Certificate": "External Services",
    "Issuance of NC Plastic Card": "External Services",
    "Issuance of Special Order (SO)": "External Services",
    "Online Processing of Program Registration Application": "External Services",
    "Payment of Training Support Fund-Last Tranche": "External Services",
    "Preparation of Provincial Qualification Map": "External Services",
    "Program Registration": "External Services",
    "Release of Starter Toolkits": "External Services",
    "Renewal of Competency Assessor’s Accreditation": "External Services",
    "Renewal of National Certificate/ Certificate of Competency": "External Services",
    "Replacement of Damaged National Certificate/Certificate of Competency": "External Services",
    "Replacement of Lost National Certificate and Certificate of Competency": "External Services",
    "Replacement of National Certificate and Certificate of Competency due to Change of Name": "External Services",
    "Replacement of NC/COC due to Erroneous Entry": "External Services",

    "Issuance of Supplies Available on Stock": "Internal Services",
    "Procurement of Supplies, Equipment and Services": "Internal Services",
};

export function getServiceCategoryFromExactList(serviceName: string): ServiceCategory | null {
    const normalized = serviceName.replace(/\s*\((External|Internal)\)\s*$/i, "").trim();

    // Explicit variants that indicate client type in the selection
    if (/For Staff$/i.test(normalized)) return "Internal Services";
    if (/For Client$/i.test(normalized)) return "External Services";

    return exactServiceCategoryMap[normalized] || null;
}

export function getServicesForOfficeAndTransactions(
    officeInput: string,
    transactionTypes: string[]
): string[] {
    // Determine office code from both old abbreviations and new full office names.
    const normalized = officeInput.toUpperCase().replace(/\s+/g, " ").trim();

    let officeKey = "";
    if (
        normalized.includes("TESDA PO DS") ||
        normalized.includes("DAVAO DEL SUR PROVINCIAL OFFICE") ||
        normalized.includes("PROVINCIAL OFFICE")
    ) {
        officeKey = "TESDA PO DS";
    } else if (
        normalized.includes("CCNTS") ||
        normalized.includes("CARMELO C. DELOS CIENTOS") ||
        normalized.includes("NATIONAL TRADE SCHOOL")
    ) {
        officeKey = "CCNTS";
    } else if (
        normalized.includes("PTC - DS") ||
        normalized.includes("PTCDDS") ||
        normalized.includes("PROVINCIAL TRAINING CENTERS")
    ) {
        officeKey = "PTC - DS";
    }

    if (!officeKey || !transactionTypes || transactionTypes.length === 0) {
        return [];
    }

    const officeContent = servicesData[officeKey];
    if (!officeContent) return [];

    const serviceSet = new Set<string>();

    for (const tType of transactionTypes) {
        const matchedCategory = officeContent[tType] || officeContent["Others"];

        if (matchedCategory) {
            if (matchedCategory["External Services"]) {
                matchedCategory["External Services"].forEach((s) => serviceSet.add(s));
            }
            if (matchedCategory["Internal Services"]) {
                matchedCategory["Internal Services"].forEach((s) => serviceSet.add(s));
            }
        }
    }

    return Array.from(serviceSet);
}

/**
 * Returns a deduplicated flat list of every service name across all offices,
 * transaction types, and categories (External / Internal).
 */
export function getAllServiceNames(): string[] {
    const names = new Set<string>();
    for (const officeKey of Object.keys(servicesData)) {
        const office = servicesData[officeKey];
        for (const txType of Object.keys(office)) {
            const categories = office[txType];
            for (const cat of Object.keys(categories) as ServiceCategory[]) {
                const services = categories[cat];
                if (services) {
                    services.forEach((s) => names.add(s));
                }
            }
        }
    }
    return Array.from(names).sort();
}
