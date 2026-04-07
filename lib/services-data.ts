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
                "Issuance of Certified True Copy (CTC) of National Certificate (NC) / Certificate of Competency (CoC)",
                "Issuance of E-Certification (NC/COC)",
                "Issuance of National TVET Trainer Certificate",
                "Issuance of NC Plastic Card",
                "Issuance of Special Order (SO)",
                "Renewal of Competency Assessor’s Accreditation",
                "Renewal of National Certificate / Certificate of Competency",
                "Replacement of Damaged National Certificate / Certificate of Competency",
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
                "Conduct of Training Induction Program",
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
                "Payment of Scholarship Vouchers",
                "Payment of Training Support Fund-Last Tranche",
            ],
            "Internal Services": [
                "Payment of Scholarship Vouchers",
                "Issuance of Supplies Available on Stock",
                "Procurement of Supplies, Equipment and Services",
            ],
        },
        "Others": {
            "External Services": [
                "Complaints Handling",
                "Customer Inquiry and Feedback Through Calls",
                "Customer Inquiry and Feedback Through Calls with concerned Office",
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
                "Conduct of Training Induction Program",
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
                "Conduct of Training Induction Program",
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

export function getServicesForOfficeAndTransactions(
    officeInput: string,
    transactionTypes: string[]
): { category: ServiceCategory; services: string[] }[] {
    // Determine which office code based on the input string 
    // e.g. "Provincial District Office (TESDA PO DS)" -> "TESDA PO DS"
    let officeKey = "";
    if (officeInput.includes("TESDA PO DS")) officeKey = "TESDA PO DS";
    else if (officeInput.includes("CCNTS")) officeKey = "CCNTS";
    else if (officeInput.includes("PTC - DS")) officeKey = "PTC - DS";

    if (!officeKey || !transactionTypes || transactionTypes.length === 0) {
        return [];
    }

    const officeContent = servicesData[officeKey];
    if (!officeContent) return [];

    const externalSet = new Set<string>();
    const internalSet = new Set<string>();

    for (const tType of transactionTypes) {
        const matchedCategory = officeContent[tType] || officeContent["Others"];

        if (matchedCategory) {
            if (matchedCategory["External Services"]) {
                matchedCategory["External Services"].forEach(s => externalSet.add(s));
            }
            if (matchedCategory["Internal Services"]) {
                matchedCategory["Internal Services"].forEach(s => internalSet.add(s));
            }
        }
    }

    const result: { category: ServiceCategory; services: string[] }[] = [];
    if (externalSet.size > 0) {
        result.push({
            category: "External Services",
            services: Array.from(externalSet).map(s => internalSet.has(s) ? `${s} (External)` : s)
        });
    }
    if (internalSet.size > 0) {
        result.push({
            category: "Internal Services",
            services: Array.from(internalSet).map(s => externalSet.has(s) ? `${s} (Internal)` : s)
        });
    }

    return result;
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
