-- Batch 1: deepen Biology Units 1-3 with official NIE 2017 competency
-- levels and learning outcomes. The source hierarchy is the official
-- G.C.E. A/L Biology syllabus implemented from 2017.

with v as (select id from public.syllabus_versions where code='GCE_AL_2017' limit 1),
bio as (select id from public.subjects where name='Biology' limit 1),
x(code,title,description,position) as (values
('1.0','Conducts investigations from a biological perspective.','Official NIE 2017 Biology competency.',1),
('2.1.0','Investigates the chemical basis of life.','Official NIE 2017 Biology competency.',2),
('2.2.0','Examines cell as the basic functioning unit of life.','Official NIE 2017 Biology competency.',3),
('2.3.0','Investigates the importance of cell cycle and cell division.','Official NIE 2017 Biology competency.',4),
('2.4.0','Investigates energy relationships in metabolic processes of organisms.','Official NIE 2017 Biology competency.',5),
('3.1.0','Explores evolution of life.','Official NIE 2017 Biology competency.',6),
('3.2.0','Explores the diversity of organisms.','Official NIE 2017 Biology competency.',7))
insert into public.syllabus_competencies(syllabus_version_id,subject_id,code,title,description,position)
select v.id,bio.id,x.code,x.title,x.description,x.position from v cross join bio cross join x
where not exists (select 1 from public.syllabus_competencies c where c.syllabus_version_id=v.id and c.subject_id=bio.id and c.code=x.code);

with v as (select id from public.syllabus_versions where code='GCE_AL_2017' limit 1),
bio as (select id from public.subjects where name='Biology' limit 1),
x(code,competency_code,title,description,position) as (values
('1.1.1','1.0','Elaborates on the nature, scope and importance of biology with reference to challenges faced by mankind.','Nature, scope, importance and applications of biology.',1),
('1.1.2','1.0','Reviews the nature and the organizational patterns of the living world.','Diversity, characteristics and hierarchical organization of living organisms.',2),
('2.1.1','2.1.0','Inquires into the elemental composition of living organisms.','Elemental composition of living matter.',1),
('2.1.2','2.1.0','Investigates the physical and chemical properties of water important for life.','Importance and properties of water for life.',2),
('2.1.3','2.1.0','Examines the chemical nature and functions of main organic compounds of organisms.','Carbohydrates, lipids, proteins, nucleic acids and related laboratory tests.',3),
('2.2.1','2.2.0','Elaborates on the contribution of microscopes to the expansion of knowledge on cells and cellular organization.','Microscopy, magnification, resolution and observation of cells.',1),
('2.2.2','2.2.0','Describes the historical background of the cell and analyses the structure and functions of subcellular units.','Cell theory, cell organization, organelles and cell communication.',2),
('2.3.1','2.3.0','Describes the cell cycle and the process of cell division.','Cell cycle, chromosomes, mitosis, meiosis and uncontrolled cell division.',1),
('2.4.1','2.4.0','Analyses the energy relationships in metabolic processes.','Metabolism, anabolic and catabolic reactions and ATP.',1),
('2.4.2','2.4.0','Investigates the role of enzymes in regulating metabolic reactions.','Enzyme action, cofactors, environmental factors and inhibitors.',2),
('2.4.3','2.4.0','Examines photosynthesis as an energy fixing mechanism.','Photosystems, light reactions, Calvin cycle, C3/C4 pathways and limiting factors.',3),
('2.4.4','2.4.0','Examines cellular respiration as a process of obtaining energy.','Aerobic and anaerobic respiration, respiratory quotient and energy yield.',4),
('3.1.1','3.1.0','Uses the theories of origin of life and natural selection to analyse the process of evolution of life.','Origin of life, evolution, Lamarck, Darwin-Wallace and Neo-Darwinism.',1),
('3.2.1','3.2.0','Constructs hierarchy of taxa on a scientific basis.','Identification, classification, nomenclature, domains and kingdoms.',1),
('3.2.2','3.2.0','Explores the diversity of organisms within Domain Bacteria.','Characteristics of bacteria and cyanobacteria and their ecological importance.',2),
('3.2.3','3.2.0','Explores the diversity of organisms within the kingdom Protista.','Characteristics and examples of protists and their ecological importance.',3),
('3.2.4','3.2.0','Explores the diversity of organisms within the kingdom Plantae.','Major plant groups, evolutionary relationships and flowering plant groups.',4),
('3.2.5','3.2.0','Explores the diversity of organisms within the kingdom Fungi.','Fungal characteristics, major phyla and ecological roles.',5),
('3.2.6','3.2.0','Explores the diversity of organisms within the kingdom Animalia.','Animal diversity, major phyla, evolutionary relationships and adaptations.',6),
('3.2.7','3.2.0','Uses the characteristic features to study organisms belonging to phylum Chordata.','Chordate classes, identification and observation.',7))
insert into public.syllabus_competency_levels(competency_id,syllabus_version_id,subject_id,code,title,description,position)
select c.id,v.id,bio.id,x.code,x.title,x.description,x.position
from x join v on true join bio on true
join public.syllabus_competencies c on c.syllabus_version_id=v.id and c.subject_id=bio.id and c.code=x.competency_code
where not exists (select 1 from public.syllabus_competency_levels cl where cl.syllabus_version_id=v.id and cl.subject_id=bio.id and cl.code=x.code);

insert into public.syllabus_topics(unit_id,title,position)
select u.id,'Metabolism and energy relationships',11
from public.syllabus_units u join public.subjects s on s.id=u.subject_id
where s.name='Biology' and u.syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017') and u.position=2
and not exists (select 1 from public.syllabus_topics t where t.unit_id=u.id and t.title='Metabolism and energy relationships');

insert into public.syllabus_subtopics(topic_id,title,description,position)
select t.id,cl.code || ' — ' || cl.title,'Official NIE 2017 Biology competency level.',cl.position
from public.syllabus_competency_levels cl
join public.syllabus_topics t on t.title = case
when cl.code='1.1.1' then 'Nature, scope and importance of biology'
when cl.code='1.1.2' then 'Organization and diversity of the biological world'
when cl.code='2.1.1' then 'Chemical basis of life'
when cl.code='2.1.2' then 'Physical and chemical properties of water'
when cl.code='2.1.3' then 'Carbohydrates, lipids, proteins and nucleic acids'
when cl.code='2.2.1' then 'Microscopy and cell structure'
when cl.code='2.2.2' then 'Cell organelles and cellular organization'
when cl.code='2.3.1' then 'Cell cycle, mitosis and meiosis'
when cl.code='2.4.1' then 'Metabolism and energy relationships'
when cl.code='2.4.2' then 'Enzymes and biological catalysts'
when cl.code='2.4.3' then 'Photosynthesis'
when cl.code='2.4.4' then 'Cellular respiration'
when cl.code='3.1.1' then 'Origin and evolution of life'
when cl.code='3.2.1' then 'Classification and taxonomy'
when cl.code='3.2.2' then 'Kingdom Monera and microorganisms'
when cl.code='3.2.3' then 'Kingdom Protista'
when cl.code='3.2.4' then 'Plant kingdom'
when cl.code='3.2.5' then 'Kingdom Fungi'
when cl.code='3.2.6' then 'Animal kingdom'
when cl.code='3.2.7' then 'Evolutionary relationships and biodiversity'
end
and t.unit_id=(select u.id from public.syllabus_units u join public.subjects s on s.id=u.subject_id where s.name='Biology' and u.syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017') and u.position=case when cl.code like '1.%' then 1 when cl.code like '2.%' then 2 else 3 end)
where cl.subject_id=(select id from public.subjects where name='Biology') and cl.syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017')
and not exists (select 1 from public.syllabus_subtopics st where st.topic_id=t.id and st.title=cl.code || ' — ' || cl.title);

-- Learning outcomes are the NIE 2017 outcomes for the competency levels above.
with outcomes(level_code,statement,position) as (values
('1.1.1','describe the nature, scope and importance of biology',1),
('1.1.1','discuss the issues and challenges faced by mankind with reference to biology',2),
('1.1.1','discuss how challenges are overcome using new technologies',3),
('1.1.1','appreciate the study of biology as a multidisciplinary subject',4),
('1.1.2','discuss the wide range in shapes, sizes, forms and habitats of living organisms',1),
('1.1.2','elaborate characteristics of living organisms',2),
('1.1.2','construct the hierarchical levels of organization with suitable examples',3),
('1.1.2','justify the cell as the basic structural and functional unit of life',4),
('1.1.2','appreciate all kinds of living organisms and their interactions',5),
('2.1.1','list the elements present in organisms',1),
('2.1.1','state the most abundant elements in organisms',2),
('2.1.2','describe physical and chemical properties of water which are important for life',1),
('2.1.2','relate the physical and chemical properties of water to its functions performed in living systems',2),
('2.1.2','explain the importance of water for life',3),
('2.1.2','appreciate the unique properties of water for existence of life',4),
('2.1.3','describe the basic chemical nature of four main types of organic compounds found in organisms',1),
('2.1.3','elaborate on the functions of four major types of organic compounds with relevant examples',2),
('2.1.3','identify the structure and functions of DNA and RNA',3),
('2.1.3','differentiate DNA and RNA',4),
('2.1.3','explain the role of DNA and RNA as hereditary material',5),
('2.1.3','state functions of ATP, NAD, FAD and NADP',6),
('2.1.3','conduct laboratory tests to identify reducing sugars, non-reducing sugars, starch, proteins and lipids',7),
('2.1.3','appreciate that proteins, carbohydrates, lipids and nucleic acids form the chemical basis of life',8),
('2.1.3','appreciate the unique properties of DNA that are important to act as the hereditary material of all organisms',9),
('2.2.1','compare significant features of the electron microscope and light microscope',1),
('2.2.1','explain magnification and resolution',2),
('2.2.1','explain main features of transmission and scanning electron microscopes',3),
('2.2.1','identify cellular and subcellular components using light microscope and electron micrographs',4),
('2.2.1','develop the skill for handling the light microscope efficiently',5),
('2.2.1','use the light microscope properly to observe specimens',6),
('2.2.1','value the contribution of microscope in biological studies',7),
('2.2.2','describe the contribution of scientists towards cell theory',1),
('2.2.2','explain the cell theory',2),
('2.2.2','explain the difference between eukaryotic and prokaryotic cells',3),
('2.2.2','compare the structural differences between plant and animal cells',4),
('2.2.2','describe the structure and function of organelles and subcellular components of cells',5),
('2.2.2','describe extracellular components',6),
('2.2.2','explain the need and significance of cellular communications',7),
('2.2.2','state components of cell communication',8),
('2.2.2','use electron micrographs to identify cellular organelles and subcellular components of a cell',9),
('2.2.2','use electron micrographs to differentiate eukaryotic and prokaryotic cellular organization',10),
('2.2.2','appreciate division of labour and compartmentalization within a cell',11),
('2.3.1','elaborate on the phases and main events of cell cycle',1),
('2.3.1','describe the basic structure of eukaryotic chromosome',2),
('2.3.1','discuss the main events that occur in each phase',3),
('2.3.1','describe the stages in mitosis and meiosis with reference to chromosomal behavior',4),
('2.3.1','describe the significance of synaptonemal complex and kinetochore',5),
('2.3.1','compare and contrast mitosis and meiosis',6),
('2.3.1','state the significance of mitosis and meiosis',7),
('2.3.1','use prepared slides to identify different stages of mitosis and meiosis under light microscope',8),
('2.3.1','state rapid and uncontrolled mitotic cell division results in formation of galls, tumors and cancers',9),
('2.4.1','explain metabolism',1),
('2.4.1','highlight the need of energy for living systems',2),
('2.4.1','explain catabolic and anabolic reactions with examples',3),
('2.4.1','discuss the structure and importance of ATP as a universal energy currency unit',4),
('2.4.1','list the cellular processes involving energy',5),
('2.4.1','appreciate the role of ATP as a universal energy currency',6),
('2.4.2','define enzymes',1),
('2.4.2','explain the general characteristics of enzymes and their role',2),
('2.4.2','describe the importance of cofactors for enzymatic activities',3),
('2.4.2','describe the mechanism of enzyme activity by using suitable diagrams',4),
('2.4.2','explain how pH, temperature, substrate concentration, enzyme concentration and inhibitors affect the rate of enzyme activity',5),
('2.4.2','conduct laboratory experiments to show how temperature affects the rate of enzyme reaction using starch-amylase system',6),
('2.4.2','appreciate the role of enzymes in metabolic reactions',7),
('2.4.3','define photosynthesis',1),
('2.4.3','discuss the global and biological importance of photosynthesis',2),
('2.4.3','differentiate the role of pigments involved in photosynthesis',3),
('2.4.3','describe the nature and significance of photosystems',4),
('2.4.3','describe the light dependent reaction of photosynthesis',5),
('2.4.3','describe the Calvin cycle of photosynthesis',6),
('2.4.3','describe the C4 pathway of photosynthesis',7),
('2.4.3','describe the impact of photorespiration on C3 plants',8),
('2.4.3','explain how C4 pathway has evolved to minimize photorespiration',9),
('2.4.3','differentiate C3 and C4 plants',10),
('2.4.3','correlate limiting factors of photosynthesis with the productivity and efficiency of plants in different environmental conditions',11),
('2.4.3','design and carry out experiments to determine the rate of photosynthesis by amount of oxygen released',12),
('2.4.3','discuss the effect of global warming on photosynthesis',13),
('2.4.3','appreciate the universal role of photosynthesis',14),
('2.4.4','define cellular respiration',1),
('2.4.4','highlight cellular respiration as the process of supplying energy for all cellular activities',2),
('2.4.4','describe the location, major events and end products of aerobic respiration',3),
('2.4.4','describe the location, major events and end products of anaerobic respiration',4),
('2.4.4','differentiate aerobic and anaerobic respiration',5),
('2.4.4','calculate efficiency of anaerobic and aerobic respiration',6),
('2.4.4','list the significance of cellular respiration',7),
('2.4.4','relate the substrate with respiratory quotient',8),
('2.4.4','determine the rate of respiration and respiratory quotient using germinating seeds',9),
('2.4.4','appreciate the significance of respiration for all organisms',10),
('3.1.1','describe the conditions on earth before life',1),
('3.1.1','describe the theories on origin of life',2),
('3.1.1','explain the process of evolution of biological diversity',3),
('3.1.1','state four eras of geological time scale',4),
('3.1.1','explain theory of Lamarck and theory of natural selection',5),
('3.1.1','relate theory of Neo-Darwinism to natural selection',6),
('3.2.1','use classification and nomenclature to identify organisms',1),
('3.2.1','distinguish between natural and artificial classification methodologies',2),
('3.2.1','describe history of systems of classification',3),
('3.2.1','define species',4),
('3.2.1','state advantages of classification of organisms',5),
('3.2.1','use and construct a dichotomous key',6),
('3.2.1','identify taxonomic levels used in classification of organisms',7),
('3.2.1','name organisms according to binomial nomenclature',8),
('3.2.1','use specific characteristics of organisms to classify them into three domains',9),
('3.2.1','describe the differences of three domains',10),
('3.2.1','state examples of each domain',11),
('3.2.1','explain the basic characteristics of kingdoms of Eukarya',12),
('3.2.1','appreciate natural diversity of organisms on earth and the need for classifying them',13),
('3.2.2','differentiate between bacteria and cyanobacteria',1),
('3.2.2','explain the characteristic features of bacteria and cyanobacteria',2),
('3.2.2','observe and distinguish bacteria and cyanobacteria under light microscope',3),
('3.2.2','recognize the importance of bacteria and cyanobacteria to the ecosystems',4),
('3.2.3','state key characteristics of kingdom Protista giving suitable examples',1),
('3.2.3','observe and identify characteristic features of typical organisms',2),
('3.2.3','recognize the importance of Protista in ecosystems',3),
('3.2.4','state characteristic features of non-vascular, vascular, vascular seedless and vascular seeded plants',1),
('3.2.4','show evolutionary relationships among major groups of plants',2),
('3.2.4','classify flowering plants as Monocots and Dicots using characteristic features',3),
('3.2.4','observe morphological features of typical organisms of the given phyla and groups',4),
('3.2.4','appreciate the importance of members of kingdom Plantae in ecosystems',5),
('3.2.5','elaborate the characteristic features of kingdom Fungi',1),
('3.2.5','classify organisms in kingdom Fungi into phyla using their vegetative and reproductive patterns',2),
('3.2.5','observe and identify key characteristic features of typical organisms of the given phyla',3),
('3.2.5','recognize the role of fungi in ecosystems',4),
('3.2.6','elaborate the characteristic features of kingdom Animalia',1),
('3.2.6','explain evolutionary relationships of major phyla',2),
('3.2.6','classify organisms in kingdom Animalia into phyla using characteristic features',3),
('3.2.6','observe characteristic features of typical organisms of the given phyla',4),
('3.2.6','appreciate the diversity of invertebrates',5),
('3.2.6','recognize the importance of members of kingdom Animalia to the ecosystem',6),
('3.2.7','identify organisms belonging to major classes of phylum Chordata',1),
('3.2.7','construct dichotomous keys to identify given examples',2),
('3.2.7','observe characteristic features of typical organisms of the given classes',3),
('3.2.7','appreciate the diversity of major classes of phylum Chordata',4))
insert into public.syllabus_learning_outcomes(subtopic_id,competency_id,competency_level_id,statement,position)
select st.id,cl.competency_id,cl.id,o.statement,o.position
from outcomes o
join public.syllabus_competency_levels cl on cl.code=o.level_code and cl.subject_id=(select id from public.subjects where name='Biology') and cl.syllabus_version_id=(select id from public.syllabus_versions where code='GCE_AL_2017')
join public.syllabus_subtopics st on st.title like o.level_code || ' — %'
where not exists (select 1 from public.syllabus_learning_outcomes lo where lo.subtopic_id=st.id and lo.statement=o.statement);
