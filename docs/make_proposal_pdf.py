from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import os

def build_story(styles):
    story = []
    title = "Smart Attendance with QR Verification and Live Session Integration for Hybrid Classrooms"
    story.append(Paragraph(title, styles["Title"]))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph("Research Question to be answered", styles["Heading2"]))
    story.append(Paragraph("How effective, secure, usable, and privacy-preserving is a QR-based attendance system with Zoom auto-join compared to traditional methods in hybrid/in-person classes?", styles["BodyText"]))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Overview, Justification and overall aim of project", styles["Heading2"]))
    overview_points = [
        "Manual roll calls are slow, error-prone, and unscalable.",
        "QR workflows are low-cost and device-friendly but vulnerable to code sharing.",
        "Live session links (Zoom) tie attendance to synchronous participation in remote or hybrid teaching.",
        "Institutions require ethical, privacy-preserving attendance systems without biometrics."
    ]
    story.append(ListFlowable([ListItem(Paragraph(p, styles["BodyText"])) for p in overview_points], bulletType="bullet"))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph("Justification", styles["Heading3"]))
    story.append(Paragraph("QR plus authenticated joins can balance integrity and usability. Few studies rigorously evaluate non-biometric attendance integrity under realistic constraints. This work addresses that gap.", styles["BodyText"]))
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph("Overall Aim", styles["Heading3"]))
    story.append(Paragraph("Design, implement, and evaluate a QR-based attendance system with Zoom auto-join, focusing on integrity, latency, usability, accessibility, and privacy, and produce deployment best practices.", styles["BodyText"]))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Objectives", styles["Heading2"]))
    objectives = [
        "Design architecture integrating sessions, rotating/per-user QR tokens, and Zoom links.",
        "Implement teacher workflow to start sessions with Zoom URL/ID and student auto-join.",
        "Instrument logging for integrity, latency, and usability metrics.",
        "Evaluate anti-sharing strategies (token lifetimes, per-user tokens, authenticated joins).",
        "Assess usability, accessibility, and privacy; develop deployment guidelines.",
        "Produce technical and policy recommendations for institutions."
    ]
    story.append(ListFlowable([ListItem(Paragraph(p, styles["BodyText"])) for p in objectives], bulletType="bullet"))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Methodology", styles["Heading2"]))
    story.append(Paragraph("Approach", styles["Heading3"]))
    story.append(Paragraph("Experimental design comparing QR variants: static codes, rotating codes, and per-user tokens; mixed methods combining quantitative metrics and qualitative usability feedback.", styles["BodyText"]))
    story.append(Paragraph("Data and Collection", styles["Heading3"]))
    story.append(ListFlowable([
        ListItem(Paragraph("Quantitative: timestamps, device type, network quality, join outcomes, duplicate/fraud flags.", styles["BodyText"])),
        ListItem(Paragraph("Qualitative: SUS questionnaire and short interviews on ease-of-use and barriers.", styles["BodyText"]))
    ], bulletType="bullet"))
    story.append(Paragraph("Analytical Tools", styles["Heading3"]))
    story.append(ListFlowable([
        ListItem(Paragraph("Statistical tests (chi-square/ANOVA) to compare variants.", styles["BodyText"])),
        ListItem(Paragraph("Descriptive analytics dashboards for latency and integrity trends.", styles["BodyText"])),
        ListItem(Paragraph("Thematic analysis of qualitative feedback.", styles["BodyText"]))
    ], bulletType="bullet"))
    story.append(Paragraph("Ethical and Practical Issues", styles["Heading3"]))
    story.append(ListFlowable([
        ListItem(Paragraph("Privacy-by-design: minimal PII, no biometrics, consent, retention limits.", styles["BodyText"])),
        ListItem(Paragraph("Accessibility: alternate flows for students without smartphones or stable internet; manual fallback with audit.", styles["BodyText"])),
        ListItem(Paragraph("Practical constraints: Wi-Fi variability and device heterogeneity; retries, grace windows, offline QR display.", styles["BodyText"]))
    ], bulletType="bullet"))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Work Plan (13 Weeks)", styles["Heading2"]))
    work_plan = [
        "Week 1: Requirements, ethics prep, consent; finalize study design.",
        "Week 2: Implement sessions with Zoom URL/ID and student auto-open; baseline QR flow.",
        "Week 3: Add rotating QR tokens; lifetimes and join windows; logging.",
        "Week 4: Implement per-user tokens; authenticated join; anomaly rules.",
        "Week 5: Pilot in one class; collect integrity/latency logs; refine UX.",
        "Week 6: Broader pilot; SUS survey; accessibility checks.",
        "Week 7: Data cleaning; preliminary statistical analysis; adjust policies.",
        "Week 8: Usability interviews; thematic coding; incorporate quick wins.",
        "Week 9: Remote/hybrid evaluation; measure Zoom auto-join impacts.",
        "Week 10: Comparative analysis of variants; dashboards and tables.",
        "Week 11: Draft technical guidelines and privacy policies.",
        "Week 12: Finalize results, limitations, recommendations; internal review.",
        "Week 13: Prepare and submit final report; dissemination demo."
    ]
    story.append(ListFlowable([ListItem(Paragraph(p, styles["BodyText"])) for p in work_plan], bulletType="bullet"))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Relationship to BS Programme/Stream", styles["Heading2"]))
    story.append(ListFlowable([
        ListItem(Paragraph("Software Engineering: backend/frontend design and integration.", styles["BodyText"])),
        ListItem(Paragraph("Web Systems: secure session and token management.", styles["BodyText"])),
        ListItem(Paragraph("HCI: usability and accessibility evaluation.", styles["BodyText"])),
        ListItem(Paragraph("Information Security: anti-sharing strategies and auditability.", styles["BodyText"])),
        ListItem(Paragraph("Data Science: experimental design and analysis.", styles["BodyText"]))
    ], bulletType="bullet"))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Indicative Reading List and Resources", styles["Heading2"]))
    story.append(Paragraph("Indicative Reading List", styles["Heading3"]))
    refs = [
        "ISO/IEC 29100. Privacy framework for ICT systems.",
        "Nielsen, J. Usability Engineering.",
        "Brooke, J. SUS: A quick and dirty usability scale.",
        "OWASP Cheat Sheet Series: Authentication and Session Management.",
        "Boniface et al. Attendance systems in higher education: technology-mediated approaches.",
        "Zimmerman. Hybrid learning design and student engagement."
    ]
    story.append(ListFlowable([ListItem(Paragraph(p, styles["BodyText"])) for p in refs], bulletType="bullet"))
    story.append(Paragraph("Resources", styles["Heading3"]))
    story.append(ListFlowable([
        ListItem(Paragraph("Hardware: instructor laptop; classroom display; student devices.", styles["BodyText"])),
        ListItem(Paragraph("Software: FastAPI, Next.js, SQLite/PostgreSQL, Zoom, analytics, survey tools.", styles["BodyText"])),
        ListItem(Paragraph("Infrastructure: secure hosting, HTTPS, optional email notifications.", styles["BodyText"]))
    ], bulletType="bullet"))
    return story

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    out_dir = base
    out_path = os.path.join(out_dir, "SmartAttendance_Proposal.pdf")
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(out_path, pagesize=A4)
    story = build_story(styles)
    doc.build(story)
    print(out_path)

if __name__ == "__main__":
    main()
