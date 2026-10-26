import json
from pydantic import BaseModel
from app.schemas import JobAnalysis, RecruiterQuestion, Lang
from app.llm import client, prompts
from fastapi import HTTPException

class RecruiterQuestionsList(BaseModel):
    questions: list[RecruiterQuestion]

def get_fallback_questions(job: JobAnalysis) -> list[RecruiterQuestion]:
    lang = job.offer_language or "fr"
    title = job.title or ("Ingénieur" if lang == "fr" else "Software Engineer")
    company = job.company or ("l'entreprise" if lang == "fr" else "the company")
    top_skills = ", ".join(job.must_have_skills[:3]) if job.must_have_skills else ("Python, SQL" if lang == "fr" else "Python, TypeScript")

    if lang == "en":
        return [
            RecruiterQuestion(
                question=f"Can you explain your hands-on experience with {top_skills} and how you applied it in your recent projects?",
                category="Technical Deep Dive",
                why_asked=f"The recruiter wants to verify practical mastery of the mandatory stack required for {title}.",
                talking_points=[
                    "Name specific projects from your CV where you built with this stack.",
                    "Highlight architectural decisions, query optimization, or performance benchmarks.",
                    "Explain how your code was tested and deployed into production."
                ],
                ideal_answer=f"In my previous work, I leveraged {top_skills} to build end-to-end features with high test coverage and clean separation of concerns. For example, I structured scalable data processing pipelines and API endpoints that handled production workloads with sub-second response times."
            ),
            RecruiterQuestion(
                question=f"How would you approach designing a resilient system or data pipeline for the responsibilities mentioned in this offer?",
                category="System Architecture",
                why_asked="Evaluates whether you think about maintainability, fault tolerance, and clean architecture.",
                talking_points=[
                    "Break down the problem into ingestion, processing, and presentation layers.",
                    "Mention data validation, schema migrations, and logging/monitoring.",
                    "Emphasize modularity to allow easy iteration."
                ],
                ideal_answer="I follow a modular architecture: decoupling ingestion from processing using background jobs or queues, adding strict schema validation at the boundaries, and maintaining centralized logging. This guarantees zero data loss and straightforward debugging."
            ),
            RecruiterQuestion(
                question="Tell me about a difficult technical bug or performance bottleneck you encountered. How did you diagnose and resolve it?",
                category="Problem Solving & Debugging",
                why_asked="Probes your analytical mindset and problem-solving method under pressure.",
                talking_points=[
                    "State the symptom and how you reproduced it systematically.",
                    "Explain the root cause identified using profiling or logs.",
                    "Show the permanent resolution and preventive measures put in place."
                ],
                ideal_answer="When facing an unexpected performance bottleneck, I reproduced the issue in a staging environment and profiled the execution to pinpoint slow database queries. I resolved it by optimizing the indexing strategy and adding caching, reducing latency by over 60% without breaking existing interfaces."
            ),
            RecruiterQuestion(
                question="How do you ensure code quality, test reliability, and safe deployments in a fast-moving team?",
                category="Engineering Best Practices",
                why_asked="Assesses engineering discipline and experience with modern CI/CD standards.",
                talking_points=[
                    "Unit tests + integration tests following the AAA pattern.",
                    "Automated CI/CD linting and static analysis checks.",
                    "Clear PR documentation and peer code reviews."
                ],
                ideal_answer="Quality is automated early: I write unit tests for critical business logic, run linting and type checks automatically on every pull request, and use reproducible containerized builds to avoid environment mismatches."
            ),
            RecruiterQuestion(
                question="How do you translate ambiguous business requirements or stakeholder requests into concrete technical deliverables?",
                category="Product & Business Impact",
                why_asked="Evaluates cross-functional communication and alignment with non-technical business partners.",
                talking_points=[
                    "Clarifying questions upfront to identify core success metrics.",
                    "Prototyping or iterating quickly with stakeholder feedback.",
                    "Delivering value iteratively rather than in one risky monolith."
                ],
                ideal_answer="I schedule a quick alignment sync to define the actual problem and target metrics. Then I break the deliverable into small, verifiable milestones so stakeholders can review real progress early and adjust before full deployment."
            ),
            RecruiterQuestion(
                question=f"Why are you specifically interested in this position at {company}, and what value will you deliver in your first 90 days?",
                category="Motivation & Impact",
                why_asked="Checks company alignment, enthusiasm, and onboarding agility.",
                talking_points=[
                    "Demonstrate knowledge of company mission and technical challenges.",
                    "Highlight self-sufficiency and quick ramp-up time.",
                    "Connect your past accomplishments to their immediate needs."
                ],
                ideal_answer=f"I'm drawn to {company} because of the opportunity to solve real problems using modern engineering practices. In my first month, I focus on understanding the codebase and shipping early fixes; within 90 days, I plan to independently deliver core features that move key metrics forward."
            )
        ]
    elif lang == "ar":
        return [
            RecruiterQuestion(
                question=f"كيف توظف خبرتك العملية في {top_skills} لإنجاز متطلبات وظيفة {title}؟",
                category="المهارات التقنية",
                why_asked="التحقق من الكفاءة التقنية العملية في التقنيات الأساسية المطلوبة.",
                talking_points=[
                    "ذكر أمثلة حية من المشاريع السابقة.",
                    "توضيح أسلوبك في بناء واجهات وتطبيقات متكاملة.",
                    "بيان معايير الجودة واختبار الكود."
                ],
                ideal_answer=f"وظفت {top_skills} في تطوير منصات وتطبيقات متكاملة مع مراعاة سرعة الأداء وجودة الكود."
            ),
            RecruiterQuestion(
                question="كيف تتعامل مع التحديات التقنية وحل المشكلات المعقدة تحت ضغط العمل؟",
                category="حل المشكلات",
                why_asked="قياس القدرة على التحليل والعمل المنظم في بيئة الإنتاج.",
                talking_points=[
                    "التشخيص المنهجي للخلل.",
                    "تحديد الحل الجذري ومنع التكرار.",
                    "التواصل الشفاف مع الفريق."
                ],
                ideal_answer="أعتمد منهجية التحليل المنهجي: عزل المشكلة، فحص السجلات، وتطبيق حل هندسي موثق يمنع تكرارها مستقبلاً."
            ),
            RecruiterQuestion(
                question=f"ما هي القيمة المضافة التي ستقدمها لفريق العمل في {company} خلال أول 3 أشهر؟",
                category="الأثر والإنتاجية",
                why_asked="الاطمئنان لسرعة الاندماج وتقديم نتائج ملموسة.",
                talking_points=[
                    "سرعة فهم بيئة العمل والكود القائم.",
                    "تسليم مهام ملموسة مبكراً.",
                    "التعاون الإيجابي مع الزملاء."
                ],
                ideal_answer=f"أستهدف فهم بنية المشاريع في الأسبوع الأول، والبدء في تسليم مهام إنتاجية ومساعدة الفريق على تحقيق أهداف {company} بكفاءة."
            )
        ]
    else:
        # Default French
        return [
            RecruiterQuestion(
                question=f"Pouvez-vous détailler votre expérience concrète avec {top_skills} et comment vous l'avez mise en pratique sur vos projets récents ?",
                category="Expertise Technique & Stack",
                why_asked=f"Le recruteur souhaite valider votre niveau d'autonomie et de maîtrise réelle sur le stack clé exigé pour {title}.",
                talking_points=[
                    "Citer des réalisations tangibles issues de vos projets ou expériences réelles.",
                    "Détailler l'architecture mise en œuvre (ETL, requêtes optimisées, API REST).",
                    "Expliquer comment vous avez validé la qualité et la robustesse du code."
                ],
                ideal_answer=f"Sur mes projets récents, j'ai utilisé {top_skills} pour concevoir des architectures robustes et documentées. J'ai notamment optimisé les temps d'exécution et structuré les pipelines de données avec des validations strictes, garantissant une utilisation fluide et des résultats fiables."
            ),
            RecruiterQuestion(
                question=f"Face aux missions décrites dans cette offre ({', '.join(job.responsibilities[:2]) if job.responsibilities else 'développement et modélisation'}), quelle serait votre démarche de travail ?",
                category="Méthodologie & Architecture",
                why_asked="Évalue votre capacité d'organisation, votre vision globale et votre méthode pour aborder un projet complexe.",
                talking_points=[
                    "Cadrage du besoin et cartographie des sources de données / composants.",
                    "Développement itératif avec jalons mesurables et tests automatisés.",
                    "Documentation claire et transmission des livrables aux utilisateurs."
                ],
                ideal_answer="Je commence par un cadrage précis pour aligner les critères de succès avec les métiers. Ensuite, je conçois une architecture modulaire et découplée, en validant chaque étape par des tests et des retours itératifs avant la mise en production."
            ),
            RecruiterQuestion(
                question="Parlez-moi d'un incident technique complexe ou d'un bug critique que vous avez rencontré. Comment avez-vous procédé pour le résoudre ?",
                category="Résolution de Problèmes",
                why_asked="Mesure votre esprit d'analyse, votre rigueur méthodologique et votre sang-froid face aux imprévus.",
                talking_points=[
                    "Reproduction systématique du problème et analyse des logs d'erreur.",
                    "Identification de la cause racine plutôt que d'un simple correctif de surface.",
                    "Mise en place de tests de non-régression et documentation du correctif."
                ],
                ideal_answer="Face à une incohérence de données en environnement de test, j'ai isolé le composant défaillant grâce à l'analyse des traces et logs. Après avoir identifié la cause racine au niveau de la jointure SQL, j'ai appliqué un correctif ciblé et rédigé un test automatisé pour garantir l'absence totale de récidive."
            ),
            RecruiterQuestion(
                question="Quelles pratiques mettez-vous en œuvre au quotidien pour garantir la fiabilité, la sécurité et la maintenabilité de vos réalisations ?",
                category="Bonnes Pratiques d'Ingénierie",
                why_asked="Vérifie votre maturité sur les standards professionnels (Git, CI/CD, tests, typage, revue de code).",
                talking_points=[
                    "Typage rigoureux et validation des données d'entrée.",
                    "Tests unitaires et d'intégration avant toute fusion.",
                    "Documentation vivante et automatisation des déploiements."
                ],
                ideal_answer="J'applique une discipline stricte : validation systématique des schémas, tests automatisés sur les fonctions critiques, gestion propre des versions avec Git (branches, commits conventionnels), et suivi rigoureux des bonnes pratiques de sécurité (pas de secrets exposés)."
            ),
            RecruiterQuestion(
                question="Comment assurez-vous la communication et la vulgarisation technique auprès d'interlocuteurs non-techniques ou métiers ?",
                category="Impact Métier & Communication",
                why_asked="Évalue votre aisance relationnelle et votre capacité à transformer des besoins métiers en solutions techniques adaptées.",
                talking_points=[
                    "Écoute active pour cerner le véritable objectif business.",
                    "Explications claires sans jargon inutile, appuyées sur des visuels ou métriques.",
                    "Démonstrations régulières pour sécuriser l'adoption par les utilisateurs."
                ],
                ideal_answer="J'adopte une communication orientée valeur : j'explique les choix techniques à travers leur impact sur les indicateurs métiers (gain de temps, réduction d'erreurs, fiabilité). Cela permet de créer une relation de confiance et de garantir que la solution répond exactement au besoin réel."
            ),
            RecruiterQuestion(
                question=f"Qu'est-ce qui vous motive dans cette opportunité chez {company}, et quelle sera votre valeur ajoutée dans les 90 premiers jours ?",
                category="Motivation & Intégration",
                why_asked="Vérifie votre motivation authentique, votre alignement culturel et votre capacité d'adaptation rapide.",
                talking_points=[
                    "Alignement avec la technicité et les enjeux de l'entreprise.",
                    "Autonomie et proactivité dans la montée en compétences.",
                    "Volonté de livrer rapidement des contributions tangibles."
                ],
                ideal_answer=f"Ce poste chez {company} réunit exactement les défis techniques qui me passionnent, notamment autour de {top_skills}. Mon objectif sur les 90 premiers jours est de maîtriser l'écosystème en place dès le premier mois pour être pleinement autonome et apporter des contributions à fort impact dès le deuxième mois."
            )
        ]

def generate_job_recruiter_questions(job: JobAnalysis) -> list[RecruiterQuestion]:
    # 1. Try to generate high-value customized questions via LLM
    try:
        user_prompt = f"Target Requisition: {job.title} at {job.company or 'Enterprise'}\n" \
                      f"Language: {job.offer_language}\n" \
                      f"Required Skills: {', '.join(job.must_have_skills)}\n" \
                      f"Responsibilities: {', '.join(job.responsibilities)}\n" \
                      f"Please generate 5 to 8 realistic recruiter interview questions."
        
        system_prompt = prompts.RECRUITER_QUESTIONS_SYSTEM.format(language=job.offer_language)
        result = client.generate(
            RecruiterQuestionsList,
            system_prompt,
            user_prompt,
            temperature=0.3
        )
        if result and len(result.questions) >= 5:
            return result.questions[:8]
    except Exception:
        pass

    # 2. Resilient instant fallback (guaranteed 5-6 structured questions)
    return get_fallback_questions(job)

def analyze_job(job_text: str) -> JobAnalysis:
    if not job_text or not job_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")
    
    user_prompt = f"Analyze the following job description and extract requirements:\n\n{job_text}"
    job_analysis = client.generate(
        JobAnalysis,
        prompts.JOB_ANALYZE_SYSTEM,
        user_prompt,
        temperature=0.2
    )

    # Attach generated recruiter questions
    job_analysis.recruiter_questions = generate_job_recruiter_questions(job_analysis)
    return job_analysis

