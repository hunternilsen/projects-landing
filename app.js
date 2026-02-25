(function () {
    // ── DOM References ──
    var scrollProgress = document.querySelector('.scroll-progress');
    var currentYearSpan = document.getElementById('current-year');
    var viewHome = document.getElementById('view-home');
    var viewProject = document.getElementById('view-project');
    var routeAnnouncer = document.getElementById('route-announcer');
    var mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    var mobileNav = document.querySelector('.mobile-nav');

    var activeFilters = { role: 'all', category: 'all' };
    var homeScrollPosition = 0;
    var isTransitioning = false;
    var originalTitle = document.title;
    var originalDescription = document.querySelector('meta[name="description"]');
    var originalOgTitle = document.querySelector('meta[property="og:title"]');
    var originalDescContent = originalDescription ? originalDescription.getAttribute('content') : '';
    var originalOgTitleContent = originalOgTitle ? originalOgTitle.getAttribute('content') : '';

    // ── DOM Helpers ──

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (key) {
                if (key === 'className') {
                    node.className = attrs[key];
                } else if (key === 'textContent') {
                    node.textContent = attrs[key];
                } else if (key === 'style') {
                    Object.assign(node.style, attrs[key]);
                } else {
                    node.setAttribute(key, attrs[key]);
                }
            });
        }
        if (children) {
            children.forEach(function (child) {
                if (typeof child === 'string') {
                    node.appendChild(document.createTextNode(child));
                } else if (child) {
                    node.appendChild(child);
                }
            });
        }
        return node;
    }

    function svgEl(paths, className) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        if (className) svg.setAttribute('class', className);
        paths.forEach(function (d) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(path);
        });
        return svg;
    }

    // ── Router ──

    function parseRoute() {
        var hash = location.hash || '#/';
        if (hash.indexOf('#/project/') === 0) {
            return { view: 'project', slug: hash.replace('#/project/', '') };
        }
        return { view: 'home', slug: null };
    }

    var sectionIds = ['about', 'experience', 'projects'];

    function handleRoute() {
        var route = parseRoute();
        var hash = location.hash || '';
        closeMobileNav();

        if (route.view === 'project' && route.slug) {
            showProjectDetail(route.slug);
            return;
        }

        // Check if hash is a section anchor (e.g. #about, #experience, #projects)
        var sectionId = hash.replace('#', '');
        var isSection = sectionIds.indexOf(sectionId) !== -1;

        if (isSection && viewHome.style.display !== 'none') {
            // Already on home view — just scroll to the section
            var target = document.getElementById(sectionId);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        if (isSection && viewHome.style.display === 'none') {
            // On detail page — switch to home then scroll
            showHomeView();
            setTimeout(function () {
                var target = document.getElementById(sectionId);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            }, 250);
            return;
        }

        showHomeView();
    }

    function fadeOut(element, callback) {
        if (isTransitioning) return;
        isTransitioning = true;
        element.classList.add('view-fade-out');
        setTimeout(function () {
            callback();
            isTransitioning = false;
        }, 200);
    }

    function fadeIn(element) {
        element.classList.remove('view-fade-out');
        element.classList.add('view-fade-in');
    }

    function updateSEO(project) {
        if (project) {
            document.title = project.title + ' — Hunter Nilsen';
            if (originalDescription) originalDescription.setAttribute('content', project.summary);
            if (originalOgTitle) originalOgTitle.setAttribute('content', project.title + ' — Hunter Nilsen');
        } else {
            document.title = originalTitle;
            if (originalDescription) originalDescription.setAttribute('content', originalDescContent);
            if (originalOgTitle) originalOgTitle.setAttribute('content', originalOgTitleContent);
        }
    }

    function showHomeView() {
        var doSwitch = function () {
            viewProject.style.display = 'none';
            while (viewProject.firstChild) viewProject.removeChild(viewProject.firstChild);
            viewHome.style.display = '';
            fadeIn(viewHome);
            document.querySelector('.footer').style.display = '';
            window.scrollTo(0, homeScrollPosition);
            updateSEO(null);
            updateActiveNav();
            routeAnnouncer.textContent = 'Returned to portfolio home';
        };

        if (viewProject.style.display !== 'none') {
            fadeOut(viewProject, doSwitch);
        } else {
            doSwitch();
        }
    }

    function showProjectDetail(slug) {
        var project = null;
        var projectIndex = -1;
        for (var i = 0; i < window.PROJECT_DATA.length; i++) {
            if (window.PROJECT_DATA[i].slug === slug) {
                project = window.PROJECT_DATA[i];
                projectIndex = i;
                break;
            }
        }
        if (!project) {
            location.hash = '#/';
            return;
        }

        homeScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        var footer = document.querySelector('.footer');

        var doSwitch = function () {
            viewHome.style.display = 'none';
            if (footer) footer.style.display = 'none';
            while (viewProject.firstChild) viewProject.removeChild(viewProject.firstChild);
            viewProject.appendChild(buildProjectDetail(project, projectIndex));
            viewProject.style.display = '';
            fadeIn(viewProject);
            window.scrollTo(0, 0);

            var heading = viewProject.querySelector('.detail-title');
            if (heading) heading.focus();

            updateSEO(project);
            routeAnnouncer.textContent = 'Viewing project: ' + project.title;
        };

        if (viewHome.style.display !== 'none') {
            fadeOut(viewHome, doSwitch);
        } else {
            // Already on a detail page, just swap content
            if (footer) footer.style.display = 'none';
            while (viewProject.firstChild) viewProject.removeChild(viewProject.firstChild);
            viewProject.appendChild(buildProjectDetail(project, projectIndex));
            window.scrollTo(0, 0);
            var heading = viewProject.querySelector('.detail-title');
            if (heading) heading.focus();
            updateSEO(project);
            routeAnnouncer.textContent = 'Viewing project: ' + project.title;
        }
    }

    function buildProjectDetail(project, projectIndex) {
        // Use rich detail renderer if available
        if (project.richDetail) {
            return buildRichProjectDetail(project, projectIndex);
        }

        // Back button
        var backLink = el('a', { href: '#/', className: 'detail-back' }, [
            svgEl(['M19 12H5M12 19l-7-7 7-7']),
            'Back to Portfolio'
        ]);

        // Title
        var title = el('h1', { className: 'detail-title', tabindex: '-1', textContent: project.title });

        // Tagline
        var tagline = el('p', { className: 'detail-tagline', textContent: project.detail.tagline });

        // Tags row
        var roleBadge = el('span', { className: 'role-badge ' + project.role, textContent: project.roleLabel });
        var tagEls = [roleBadge];
        project.tags.forEach(function (t) {
            tagEls.push(el('span', { className: 'category-tag', textContent: t }));
        });
        var tagsRow = el('div', { className: 'detail-tags' }, tagEls);

        var headerChildren = [title, tagline];
        if (project.company) {
            headerChildren.push(el('p', { className: 'detail-company', textContent: project.company }));
        }
        headerChildren.push(tagsRow);
        var header = el('div', { className: 'detail-header' }, headerChildren);

        // Metrics
        var metricCards = project.detail.metrics.map(function (m) {
            return el('div', { className: 'metric-card' }, [
                el('div', { className: 'metric-value', textContent: m.value }),
                el('div', { className: 'metric-label', textContent: m.label })
            ]);
        });
        var metricsGrid = el('div', { className: 'detail-metrics' }, metricCards);

        // The Problem
        var problemSection = el('div', { className: 'detail-section' }, [
            el('h2', { textContent: 'The Problem' }),
            el('p', { textContent: project.detail.problem })
        ]);

        // The Solution
        var impactItems = project.impactAreas.map(function (area) {
            return el('li', { textContent: area });
        });
        var solutionSection = el('div', { className: 'detail-section' }, [
            el('h2', { textContent: 'The Solution' }),
            el('p', { textContent: project.detail.solution }),
            el('h3', {
                textContent: 'Impact Areas',
                style: { fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '8px' }
            }),
            el('ul', { className: 'impact-list' }, impactItems)
        ]);

        // Building the Solution
        var buildingSection = el('div', { className: 'detail-section' }, [
            el('h2', { textContent: 'Building the Solution' }),
            el('p', { textContent: project.detail.building })
        ]);

        // Results & Impact
        var resultsSection = el('div', { className: 'detail-section' }, [
            el('h2', { textContent: 'Results & Impact' }),
            el('p', { textContent: project.detail.results })
        ]);

        // Next/Previous navigation
        var data = window.PROJECT_DATA;
        var prevProject = projectIndex > 0 ? data[projectIndex - 1] : null;
        var nextProject = projectIndex < data.length - 1 ? data[projectIndex + 1] : null;

        var navChildren = [];
        if (prevProject) {
            var prevLink = el('a', { href: '#/project/' + prevProject.slug, className: 'detail-nav-link prev' }, [
                el('span', { className: 'detail-nav-label', textContent: 'Previous' }),
                el('span', { className: 'detail-nav-title', textContent: prevProject.title })
            ]);
            navChildren.push(prevLink);
        }
        if (nextProject) {
            var nextLink = el('a', { href: '#/project/' + nextProject.slug, className: 'detail-nav-link next' }, [
                el('span', { className: 'detail-nav-label', textContent: 'Next' }),
                el('span', { className: 'detail-nav-title', textContent: nextProject.title })
            ]);
            navChildren.push(nextLink);
        }
        var detailNav = navChildren.length > 0 ? el('nav', { className: 'detail-nav', 'aria-label': 'Project navigation' }, navChildren) : null;

        // Assemble
        var containerChildren = [
            backLink, header, metricsGrid,
            problemSection, solutionSection, buildingSection, resultsSection
        ];
        if (detailNav) containerChildren.push(detailNav);

        var container = el('div', { className: 'container' }, containerChildren);

        return el('div', { className: 'detail-view' }, [container]);
    }

    // ── Rich Detail Renderer ──

    function buildRichProjectDetail(project, projectIndex) {
        var rd = project.richDetail;
        var children = [];

        // Back button
        children.push(el('a', { href: '#/', className: 'detail-back' }, [
            svgEl(['M19 12H5M12 19l-7-7 7-7']),
            'Back to Portfolio'
        ]));

        // Header
        var roleBadge = el('span', { className: 'role-badge ' + project.role, textContent: project.roleLabel });
        var tagEls = [roleBadge];
        project.tags.forEach(function (t) {
            tagEls.push(el('span', { className: 'category-tag', textContent: t }));
        });

        var richHeaderChildren = [
            el('h1', { className: 'detail-title', tabindex: '-1', textContent: project.title }),
            el('p', { className: 'detail-tagline', textContent: rd.subtitle || project.detail.tagline })
        ];
        if (project.company) {
            richHeaderChildren.push(el('p', { className: 'detail-company', textContent: project.company }));
        }
        richHeaderChildren.push(el('div', { className: 'detail-tags' }, tagEls));
        children.push(el('div', { className: 'detail-header' }, richHeaderChildren));

        // Hero stats
        if (rd.heroStats && rd.heroStats.length) {
            var statEls = rd.heroStats.map(function (s) {
                return el('div', { className: 'rich-hero-stat' }, [
                    el('div', { className: 'rich-stat-value', textContent: s.value }),
                    el('div', { className: 'rich-stat-label', textContent: s.label })
                ]);
            });
            children.push(el('div', { className: 'rich-hero-stats' }, statEls));
        }

        // Render each section
        rd.sections.forEach(function (section, sIdx) {
            var sectionEl = buildRichSection(section, sIdx);
            if (sectionEl) children.push(sectionEl);
        });

        // Next/Previous navigation
        var data = window.PROJECT_DATA;
        var prevProject = projectIndex > 0 ? data[projectIndex - 1] : null;
        var nextProject = projectIndex < data.length - 1 ? data[projectIndex + 1] : null;
        var navChildren = [];
        if (prevProject) {
            navChildren.push(el('a', { href: '#/project/' + prevProject.slug, className: 'detail-nav-link prev' }, [
                el('span', { className: 'detail-nav-label', textContent: 'Previous' }),
                el('span', { className: 'detail-nav-title', textContent: prevProject.title })
            ]));
        }
        if (nextProject) {
            navChildren.push(el('a', { href: '#/project/' + nextProject.slug, className: 'detail-nav-link next' }, [
                el('span', { className: 'detail-nav-label', textContent: 'Next' }),
                el('span', { className: 'detail-nav-title', textContent: nextProject.title })
            ]));
        }
        if (navChildren.length) {
            children.push(el('nav', { className: 'detail-nav', 'aria-label': 'Project navigation' }, navChildren));
        }

        var container = el('div', { className: 'container' }, children);
        return el('div', { className: 'detail-view' }, [container]);
    }

    function buildRichSectionHeader(section) {
        var headerChildren = [];
        if (section.overline) {
            headerChildren.push(el('span', { className: 'rich-section-overline', textContent: section.overline }));
        }
        if (section.title) {
            headerChildren.push(el('h2', { textContent: section.title }));
        }
        if (section.subtitle) {
            headerChildren.push(el('p', { textContent: section.subtitle }));
        }
        return el('div', { className: 'rich-section-header' }, headerChildren);
    }

    function buildRichSection(section, sIdx) {
        var isAlt = sIdx % 2 === 0;

        switch (section.type) {

            case 'features': {
                var cards = section.cards.map(function (c) {
                    return el('div', { className: 'rich-card-h' }, [
                        el('div', { className: 'rich-card-icon', textContent: c.icon }),
                        el('div', { className: 'rich-card-body' }, [
                            el('h3', { textContent: c.title }),
                            el('p', { textContent: c.description })
                        ])
                    ]);
                });
                var wrapper = el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-card-grid' }, cards)
                ]);
                return wrapper;
            }

            case 'three-col': {
                var colCards = section.cards.map(function (c) {
                    return el('div', { className: 'rich-col-card' }, [
                        el('div', { className: 'rich-col-card-icon', textContent: c.icon }),
                        el('h4', { textContent: c.title }),
                        el('p', { textContent: c.description })
                    ]);
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-three-col' }, colCards)
                ]);
            }

            case 'compare': {
                // Build table header
                var thRow = el('tr', {}, section.headers.map(function (h) {
                    return el('th', { textContent: h });
                }));
                var thead = el('thead', {}, [thRow]);

                // Build table body
                var tbodyRows = section.rows.map(function (row) {
                    return el('tr', {}, [
                        el('td', { textContent: row[0] }),
                        el('td', { className: 'compare-cross', textContent: row[1] }),
                        el('td', { className: 'compare-check', textContent: row[2] })
                    ]);
                });
                var tbody = el('tbody', {}, tbodyRows);

                var table = el('table', { className: 'rich-compare-table' }, [thead, tbody]);
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    table
                ]);
            }

            case 'workflow': {
                var flowEls = [];
                section.steps.forEach(function (step, i) {
                    if (i > 0) {
                        flowEls.push(el('span', { className: 'rich-workflow-arrow', textContent: '\u2192' }));
                    }
                    var stepChildren = [step.label];
                    if (step.sublabel) {
                        stepChildren = [];
                        stepChildren.push(document.createTextNode(step.label));
                        stepChildren.push(el('small', { textContent: step.sublabel }));
                    }
                    flowEls.push(el('div', { className: 'rich-workflow-step' }, stepChildren));
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-workflow' }, flowEls)
                ]);
            }

            case 'pipeline': {
                var pipeEls = [];
                section.stages.forEach(function (stage, i) {
                    if (i > 0) {
                        pipeEls.push(el('span', { className: 'rich-pipeline-arrow', textContent: '\u2192' }));
                    }
                    pipeEls.push(el('div', { className: 'rich-pipeline-stage' }, [
                        el('div', { className: 'rich-pipeline-stage-icon', textContent: stage.icon }),
                        el('h4', { textContent: stage.title }),
                        el('p', { textContent: stage.description })
                    ]));
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-pipeline' }, pipeEls)
                ]);
            }

            case 'tech': {
                var pills = section.items.map(function (item) {
                    return el('div', { className: 'rich-tech-pill' }, [
                        el('div', { className: 'rich-tech-pill-icon', textContent: item.icon }),
                        el('div', {}, [
                            el('h4', { textContent: item.title }),
                            el('p', { textContent: item.description })
                        ])
                    ]);
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-tech-grid' }, pills)
                ]);
            }

            case 'steps': {
                var stepEls = section.items.map(function (item, i) {
                    return el('div', { className: 'rich-step' }, [
                        el('div', { className: 'rich-step-num', textContent: String(i + 1) }),
                        el('div', { className: 'rich-step-content' }, [
                            el('h3', { textContent: item.title }),
                            el('p', { textContent: item.description })
                        ])
                    ]);
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-steps' }, stepEls)
                ]);
            }

            case 'rubric': {
                var rubricChildren = [];
                if (section.scoreNote) {
                    rubricChildren.push(el('div', { className: 'rich-callout', style: { marginTop: '0', marginBottom: '32px' } }, [
                        el('h4', { textContent: 'Scoring Scale: 0\u20135' }),
                        el('p', { textContent: section.scoreNote })
                    ]));
                }
                section.categories.forEach(function (cat, catIdx) {
                    var rubricCard = el('div', { className: 'rich-rubric' });

                    // Header (clickable)
                    var headerInner = [
                        el('div', { className: 'rich-rubric-num', textContent: String(catIdx + 1) }),
                        el('div', { className: 'rich-rubric-title' }, [
                            el('h3', { textContent: cat.title }),
                            el('p', { textContent: cat.description })
                        ]),
                        svgEl(['M6 9l6 6 6-6'], 'rich-rubric-toggle')
                    ];
                    var header = el('div', { className: 'rich-rubric-header' }, headerInner);
                    header.addEventListener('click', function () {
                        rubricCard.classList.toggle('open');
                    });
                    rubricCard.appendChild(header);

                    // Body (hidden by default)
                    var tierEls = cat.tiers.map(function (tier) {
                        var tierChildren = [
                            el('div', { className: 'rich-rubric-tier-badge' }, [
                                el('div', { className: 'rich-rubric-tier-score', textContent: tier.scores }),
                                el('div', { className: 'rich-rubric-tier-label', textContent: tier.level === 'high' ? 'High' : tier.level === 'mid' ? 'Mid' : 'Low' })
                            ]),
                            el('div', { className: 'rich-rubric-tier-content' }, [
                                el('p', { textContent: tier.content }),
                                el('div', { className: 'rich-rubric-tier-example', textContent: '\u201C' + tier.example + '\u201D' })
                            ])
                        ];
                        return el('div', { className: 'rich-rubric-tier ' + tier.level }, tierChildren);
                    });
                    var body = el('div', { className: 'rich-rubric-body' }, [
                        el('div', { className: 'rich-rubric-tiers' }, tierEls)
                    ]);
                    rubricCard.appendChild(body);
                    rubricChildren.push(rubricCard);
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-rubric-list' }, rubricChildren)
                ]);
            }

            case 'accordion': {
                var accordionChildren = [];
                section.items.forEach(function (item, idx) {
                    var card = el('div', { className: 'rich-rubric' });
                    var headerInner = [
                        el('div', { className: 'rich-rubric-num', textContent: String(idx + 1) }),
                        el('div', { className: 'rich-rubric-title' }, [
                            el('h3', { textContent: item.title }),
                            el('p', { textContent: item.description })
                        ]),
                        svgEl(['M6 9l6 6 6-6'], 'rich-rubric-toggle')
                    ];
                    var header = el('div', { className: 'rich-rubric-header' }, headerInner);
                    header.addEventListener('click', function () {
                        card.classList.toggle('open');
                    });
                    card.appendChild(header);
                    var body = el('div', { className: 'rich-rubric-body' }, [
                        el('p', { textContent: item.content, style: { fontSize: '14px', lineHeight: '1.6' } })
                    ]);
                    card.appendChild(body);
                    accordionChildren.push(card);
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-rubric-list' }, accordionChildren)
                ]);
            }

            case 'modules': {
                var moduleCards = section.items.map(function (m) {
                    return el('div', { className: 'rich-module-card' }, [
                        el('div', { className: 'rich-module-card-header' }, [
                            el('span', { className: 'rich-module-name', textContent: m.name }),
                            el('span', { className: 'rich-module-badge', textContent: m.lines + ' lines' })
                        ]),
                        el('div', { className: 'rich-module-desc', textContent: m.description })
                    ]);
                });
                var sectionChildren = [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-module-grid' }, moduleCards)
                ];
                // Dependency flow
                if (section.depFlow && section.depFlow.length) {
                    var flowRows = section.depFlow.map(function (dep) {
                        return el('div', { className: 'rich-dep-row' }, [
                            el('div', { className: 'rich-dep-node rich-dep-orchestrator', textContent: dep.from }),
                            el('span', { className: 'rich-dep-arrow', textContent: '\u2192' }),
                            el('div', { className: 'rich-dep-node', textContent: dep.to })
                        ]);
                    });
                    var depFlow = el('div', { className: 'rich-dep-flow' }, [
                        el('div', { className: 'rich-dep-title', textContent: section.depTitle || 'Dependency Injection \u2014 No Circular Imports' })
                    ].concat(flowRows));
                    sectionChildren.push(depFlow);
                }
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, sectionChildren);
            }

            case 'data-architecture': {
                var tierEls = [];
                section.tiers.forEach(function (tier, tIdx) {
                    if (tIdx > 0) {
                        tierEls.push(el('div', { className: 'rich-data-arrow', textContent: '\u2193' }));
                    }
                    var itemEls = tier.items.map(function (item) {
                        return el('div', { className: 'rich-data-node' }, [
                            el('strong', { textContent: item.title }),
                            el('small', { textContent: item.detail })
                        ]);
                    });
                    var labelClass = 'rich-data-tier-label';
                    if (tier.color === 'accent') labelClass += ' accent';
                    else if (tier.color === 'green') labelClass += ' green';
                    tierEls.push(el('div', { className: 'rich-data-tier' }, [
                        el('div', { className: labelClass, textContent: tier.label }),
                        el('div', { className: 'rich-data-nodes' }, itemEls)
                    ]));
                });
                var archChildren = [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-data-flow' }, tierEls)
                ];
                if (section.metrics && section.metrics.length) {
                    var metricEls = section.metrics.map(function (m) {
                        return el('div', { className: 'rich-data-metric' }, [
                            el('div', { className: 'rich-data-metric-value', textContent: m.value }),
                            el('div', { className: 'rich-data-metric-label', textContent: m.label })
                        ]);
                    });
                    archChildren.push(el('div', { className: 'rich-data-metrics' }, metricEls));
                }
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, archChildren);
            }

            case 'timeline': {
                var timelineItems = section.items.map(function (item) {
                    var itemChildren = [];
                    if (item.phase) {
                        itemChildren.push(el('div', { className: 'rich-timeline-phase', textContent: item.phase }));
                    }
                    itemChildren.push(el('h4', { textContent: item.title }));
                    itemChildren.push(el('p', { textContent: item.description }));
                    if (item.pills && item.pills.length) {
                        var pillEls = item.pills.map(function (pill) {
                            return el('span', { className: 'rich-timeline-pill', textContent: pill });
                        });
                        itemChildren.push(el('div', { className: 'rich-timeline-pills' }, pillEls));
                    }
                    return el('div', { className: 'rich-timeline-item' }, itemChildren);
                });
                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-timeline' }, timelineItems)
                ]);
            }

            case 'callout': {
                return el('div', { className: 'rich-callout' }, [
                    el('h4', { textContent: section.title }),
                    el('p', { textContent: section.content })
                ]);
            }

            case 'architecture': {
                // Before card with code block
                var beforeLines = section.before.lines.map(function (line) {
                    var isComment = line.indexOf('//') === 0;
                    var isFunction = line.indexOf('function') === 0;
                    if (isComment) {
                        return el('span', { className: 'rich-code-comment', textContent: line + '\n' });
                    } else if (isFunction) {
                        var parts = line.split('function ');
                        var fnNameEnd = parts[1].indexOf('(');
                        var fnName = parts[1].substring(0, fnNameEnd);
                        var rest = parts[1].substring(fnNameEnd);
                        var lineEl = document.createDocumentFragment();
                        lineEl.appendChild(el('span', { className: 'rich-code-keyword', textContent: 'function ' }));
                        lineEl.appendChild(el('span', { style: { color: '#FFD54F' }, textContent: fnName }));
                        lineEl.appendChild(document.createTextNode(rest + '\n'));
                        return lineEl;
                    }
                    return document.createTextNode(line + '\n');
                });

                var beforePre = el('pre', {}, beforeLines);
                var beforeCode = el('div', { className: 'rich-code-block' }, [
                    el('div', { className: 'rich-code-block-header' }, [
                        el('span', { className: 'rich-code-dot' }),
                        el('span', { className: 'rich-code-dot' }),
                        el('span', { className: 'rich-code-dot' }),
                        el('span', { className: 'rich-code-title', textContent: 'app.js \u2014 3,445 lines' })
                    ]),
                    beforePre
                ]);

                var beforeCard = el('div', { className: 'rich-arch-card' }, [
                    el('h3', { textContent: section.before.title }),
                    el('p', { textContent: section.before.description }),
                    beforeCode
                ]);

                // After card with module list
                var afterLines = section.after.modules.map(function (m) {
                    var lineEl = document.createDocumentFragment();
                    lineEl.appendChild(el('span', { className: 'rich-code-keyword', textContent: m.name }));
                    var padding = '            '.substring(0, 14 - m.name.length);
                    lineEl.appendChild(el('span', { className: 'rich-code-comment', textContent: padding + m.lines + ' lines  \u00B7 ' + m.desc }));
                    lineEl.appendChild(document.createTextNode('\n'));
                    return lineEl;
                });

                var afterPre = el('pre', {}, afterLines);
                var afterCode = el('div', { className: 'rich-code-block' }, [
                    el('div', { className: 'rich-code-block-header' }, [
                        el('span', { className: 'rich-code-dot' }),
                        el('span', { className: 'rich-code-dot' }),
                        el('span', { className: 'rich-code-dot' }),
                        el('span', { className: 'rich-code-title', textContent: 'modules/' })
                    ]),
                    afterPre
                ]);

                var afterCard = el('div', { className: 'rich-arch-card' }, [
                    el('h3', { textContent: section.after.title }),
                    el('p', { textContent: section.after.description }),
                    afterCode
                ]);

                return el('div', { className: 'rich-section' + (isAlt ? ' rich-section-alt' : '') }, [
                    buildRichSectionHeader(section),
                    el('div', { className: 'rich-arch-grid' }, [beforeCard, afterCard])
                ]);
            }

            default:
                return null;
        }
    }

    // ── Scroll Progress ──

    function updateScrollProgress() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        scrollProgress.style.width = pct + '%';
        scrollProgress.setAttribute('aria-valuenow', Math.round(pct));
    }

    // ── Filtering ──

    function filterProjects() {
        var cards = document.querySelectorAll('#view-home .project-card');
        var roleFilter = activeFilters.role;
        var categoryFilter = activeFilters.category;
        var visibleCount = 0;

        cards.forEach(function (card) {
            var roleMatch = roleFilter === 'all' || card.getAttribute('data-role') === roleFilter;
            var catMatch = categoryFilter === 'all' || card.getAttribute('data-category') === categoryFilter;
            if (roleMatch && catMatch) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        updateSectionVisibility();

        // Show/hide empty state
        var emptyState = document.getElementById('filter-empty-state');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? '' : 'none';
        }
    }

    function updateSectionVisibility() {
        var sections = document.querySelectorAll('#view-home .project-category');
        sections.forEach(function (section) {
            var cards = section.querySelectorAll('.project-card');
            var visible = Array.from(cards).some(function (c) { return !c.classList.contains('hidden'); });
            section.style.display = visible ? '' : 'none';
        });
    }

    function handleFilterClick(event) {
        var btn = event.currentTarget;
        var type = btn.getAttribute('data-filter-type');
        var value = btn.getAttribute('data-filter-value');

        document.querySelectorAll('[data-filter-type="' + type + '"]').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        activeFilters[type] = value;
        filterProjects();
    }

    // ── Mobile Nav ──

    function toggleMobileNav() {
        var isOpen = mobileNav.classList.toggle('open');
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    }

    function closeMobileNav() {
        if (mobileNav) {
            mobileNav.classList.remove('open');
            if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // ── Active Nav Highlighting ──

    function updateActiveNav() {
        var navLinks = document.querySelectorAll('.header-nav a');
        if (!navLinks.length) return;

        // Only highlight on home view
        if (viewHome.style.display === 'none') {
            navLinks.forEach(function (link) { link.classList.remove('active'); });
            return;
        }

        var sections = ['about', 'experience', 'projects'];
        var current = '';
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var offset = 120;

        for (var i = sections.length - 1; i >= 0; i--) {
            var section = document.getElementById(sections[i]);
            if (section && section.offsetTop - offset <= scrollTop) {
                current = sections[i];
                break;
            }
        }

        navLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (href === '#' + current) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // ── Intersection Observer ──

    function setupIntersectionObserver() {
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var cards = document.querySelectorAll('#view-home .project-card');

        if (prefersReducedMotion) {
            cards.forEach(function (card) {
                card.style.opacity = '1';
                card.style.transform = 'none';
            });
            return;
        }

        // Hide cards before observing so animation goes 0→1 without flash
        cards.forEach(function (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(24px)';
        });

        var options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

        var sections = document.querySelectorAll('#view-home .project-category');
        sections.forEach(function (section) {
            var sectionCards = section.querySelectorAll('.project-card');
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        Array.from(sectionCards).forEach(function (card, i) {
                            setTimeout(function () {
                                card.classList.add('fade-in-up');
                            }, i * 80);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, options);
            observer.observe(section);
        });
    }

    // ── Init ──

    function init() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        window.addEventListener('scroll', function () {
            updateScrollProgress();
            updateActiveNav();
        });
        window.addEventListener('resize', updateScrollProgress);
        window.addEventListener('hashchange', handleRoute);

        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', handleFilterClick);
        });

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', toggleMobileNav);
        }

        if (mobileNav) {
            mobileNav.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', closeMobileNav);
            });
        }

        // Nav links: if on detail page, go home first then scroll to section
        document.querySelectorAll('.header-nav a, .mobile-nav a').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var route = parseRoute();
                if (route.view === 'project') {
                    e.preventDefault();
                    var targetId = link.getAttribute('href').replace('#', '');
                    location.hash = '#/';
                    // After home view renders, scroll to section
                    setTimeout(function () {
                        var target = document.getElementById(targetId);
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                    }, 250);
                }
            });
        });

        setupIntersectionObserver();
        updateScrollProgress();
        filterProjects();
        handleRoute();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
