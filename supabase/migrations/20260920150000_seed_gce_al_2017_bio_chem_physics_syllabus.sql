-- Seed the NIE G.C.E. (A/L) 2017 Biology, Chemistry and Physics syllabus.
-- Source: National Institute of Education, Department of Science.
do $$
declare
  v_version uuid;
  v_subject uuid;
  v_unit uuid;
  item record;
  topic_item record;
begin
  insert into public.syllabus_versions (code,name,academic_year_from,academic_year_to,is_active,notes)
  values ('GCE_AL_2017','G.C.E. Advanced Level 2017 Syllabus',2017,null,true,'NIE Department of Science syllabus for the rationalized G.C.E. (A/L) curriculum implemented from 2017.')
  on conflict (code) do update set name=excluded.name, academic_year_from=excluded.academic_year_from, academic_year_to=excluded.academic_year_to, is_active=excluded.is_active, notes=excluded.notes
  returning id into v_version;

  insert into public.syllabus_version_subjects (syllabus_version_id,subject_id)
  select v_version,s.id from public.subjects s where s.name in ('Biology','Chemistry','Physics')
  on conflict do nothing;

  select id into v_subject from public.subjects where name='Biology';
  for item in select * from (values
    (1,'Introduction to Biology',array['Nature, scope and importance of biology','Challenges faced by humankind and applications of biology','Organization and diversity of the biological world']),
    (2,'Chemical & Cellular Basis of Life',array['Chemical basis of life','Physical and chemical properties of water','Carbohydrates, lipids, proteins and nucleic acids','Microscopy and cell structure','Cell membranes and transport','Cell organelles and cellular organization','Cell cycle, mitosis and meiosis','Enzymes and biological catalysts','Cellular respiration','Photosynthesis']),
    (3,'Evolution and Diversity of Organisms',array['Origin and evolution of life','Evidence for evolution','Natural selection and adaptation','Classification and taxonomy','Kingdom Monera and microorganisms','Kingdom Protista','Kingdom Fungi','Plant kingdom','Animal kingdom','Evolutionary relationships and biodiversity']),
    (4,'Plant Form & Function',array['Plant tissues and tissue systems','Plant anatomy and organ structure','Transport of water and minerals','Transpiration','Transport of organic substances','Mineral nutrition','Photosynthesis','Plant respiration','Plant growth and development','Plant hormones and tropisms','Plant reproduction and reproductive structures']),
    (5,'Animal Form & Function',array['Animal tissues and organization','Nutrition and digestion','Respiration and gas exchange','Circulation and transport','Excretion and osmoregulation','Nervous coordination','Sensory structures','Endocrine coordination','Homeostasis','Reproduction and reproductive systems','Human reproductive cycles and birth control','Skeletal system and movement']),
    (6,'Genetics',array['Genetic terminology and Mendelian inheritance','Monohybrid crosses','Dihybrid crosses','Probability and inheritance','Test crosses','Human inheritance','Non-Mendelian inheritance','Multiple alleles','Population genetics','Plant and animal breeding']),
    (7,'Molecular Biology & Recombinant DNA Technology',array['DNA structure and replication','RNA and transcription','Translation and protein synthesis','Gene expression and regulation','Mutations','Recombinant DNA technology','Restriction enzymes and vectors','PCR and DNA amplification','Applications of genetic engineering']),
    (8,'Environmental Biology',array['Ecosystems and ecological organization','Energy flow and food chains','Population ecology','Community ecology','Biogeochemical cycles','Biodiversity and conservation','Environmental pollution','Climate and environmental change','Sustainable use of natural resources']),
    (9,'Microbiology',array['Nature of microorganisms','Types of microorganisms','Basic microbiological laboratory techniques','Microorganisms in industry, agriculture and environment','Soil microbiology','Domestic water and wastewater microbiology','Solid waste treatment','Microorganisms and food']),
    (10,'Applied Biology',array['Aquaculture','Ornamental fish culture','Diseases of cultured freshwater and ornamental fish','Nursery management and propagation','Food preservation and postharvest losses','Dengue and filariasis','Nanotechnology','Stem cell therapy','Human Genome Project'])
  ) as x(position,title,topics)
  loop
    insert into public.syllabus_units(subject_id,syllabus_version_id,title,position) values(v_subject,v_version,item.title,item.position) on conflict do nothing returning id into v_unit;
    if v_unit is null then select id into v_unit from public.syllabus_units where subject_id=v_subject and syllabus_version_id=v_version and position=item.position; end if;
    for topic_item in select row_number() over () as position, t.title from unnest(item.topics) as t(title)
    loop insert into public.syllabus_topics(unit_id,title,position) values(v_unit,topic_item.title,topic_item.position) on conflict do nothing; end loop;
  end loop;

  select id into v_subject from public.subjects where name='Chemistry';
  for item in select * from (values
    (1,'Atomic Structure',array['Subatomic particles and atomic models','Atomic number, mass number and isotopes','Electromagnetic radiation and spectra','Bohr model and energy levels','Quantum numbers and orbitals','Electronic configuration']),
    (2,'Structure and Bonding',array['Lewis structures','Ionic bonding','Covalent bonding','Coordinate covalent bonding','Electronegativity and polarity','Molecular geometry','Intermolecular forces','Lattice structures and properties']),
    (3,'Chemical Calculations',array['Relative atomic and molecular masses','Mole concept and Avogadro constant','Stoichiometric calculations','Empirical and molecular formulae','Concentration of solutions','Preparation of solutions','Limiting reagents and percentage yield']),
    (4,'Gaseous State of Matter',array['Gas laws','Ideal gas equation','Kinetic theory of gases','Molar volume and gas calculations','Real gases and deviations']),
    (5,'Energetics',array['Energy changes in chemical reactions','Enthalpy changes','Calorimetry','Hess law','Bond enthalpy','Entropy and feasibility']),
    (6,'Chemistry of s, p and d Block Elements',array['Periodic trends','Chemistry of s-block elements','Chemistry of p-block elements','Chemistry of d-block elements','Properties and reactions of selected compounds','Transition elements and complexes']),
    (7,'Basic Concepts of Organic Chemistry',array['Organic compounds and classification','Nomenclature','Isomerism','Bonding and hybridization in organic compounds','Organic reaction mechanisms','Purification and analysis of organic compounds']),
    (8,'Hydrocarbons and Halohydrocarbons',array['Alkanes','Alkenes','Alkynes','Aromatic hydrocarbons','Halogenoalkanes and halogenoarenes','Preparation and reactions of hydrocarbons']),
    (9,'Oxygen Containing Organic Compounds',array['Alcohols','Phenols','Ethers','Aldehydes','Ketones','Carboxylic acids','Esters and related reactions']),
    (10,'Nitrogen Containing Organic Compounds',array['Amines','Amides','Amino compounds and basicity','Diazonium compounds','Selected nitrogen-containing organic reactions']),
    (11,'Chemical Kinetics',array['Rate of reaction','Factors affecting reaction rate','Rate laws','Order of reaction','Activation energy','Arrhenius equation','Catalysis']),
    (12,'Equilibrium',array['Dynamic equilibrium','Equilibrium constant','Le Chatelier principle','Acid-base equilibrium','pH and pOH','Buffer solutions','Solubility equilibrium','Common ion effect']),
    (13,'Electrochemistry',array['Redox reactions','Electrochemical cells','Cell potentials','Nernst equation','Electrolysis','Faraday laws','Applications of electrochemistry']),
    (14,'Industrial Chemistry and Environmental Pollution',array['Industrial chemical processes','Fertilizer industry','Cement and related industries','Petrochemical industry','Metallurgy and extraction','Chemical pollution','Air and water pollution','Waste treatment and environmental protection'])
  ) as x(position,title,topics)
  loop
    insert into public.syllabus_units(subject_id,syllabus_version_id,title,position) values(v_subject,v_version,item.title,item.position) on conflict do nothing returning id into v_unit;
    if v_unit is null then select id into v_unit from public.syllabus_units where subject_id=v_subject and syllabus_version_id=v_version and position=item.position; end if;
    for topic_item in select row_number() over () as position, t.title from unnest(item.topics) as t(title)
    loop insert into public.syllabus_topics(unit_id,title,position) values(v_unit,topic_item.title,topic_item.position) on conflict do nothing; end loop;
  end loop;

  select id into v_subject from public.subjects where name='Physics';
  for item in select * from (values
    (1,'Measurement',array['Physical quantities and SI units','Dimensions','Measurement uncertainty and errors','Significant figures and scientific notation','Experimental graphs and data analysis']),
    (2,'Mechanics',array['Kinematics','Vectors and scalars','Dynamics and Newton laws','Momentum and collisions','Work, energy and power','Circular motion','Rotational motion','Centre of mass','Simple harmonic motion foundations','Fluid mechanics']),
    (3,'Oscillations and Waves',array['Oscillations','Simple harmonic motion','Progressive waves','Wave equation and properties','Superposition','Stationary waves','Sound waves','Doppler effect','Interference and diffraction','Geometrical optics and lenses']),
    (4,'Thermal Physics',array['Temperature and thermal equilibrium','Thermal expansion','Heat capacity and calorimetry','Change of state and latent heat','Kinetic theory','First law of thermodynamics','Second law and entropy','Heat engines and refrigerators']),
    (5,'Gravitational Field',array['Gravitational field and potential','Newton law of gravitation','Gravitational potential energy','Orbital motion','Satellites and escape velocity']),
    (6,'Electrostatic Field',array['Electric charge and Coulomb law','Electric field','Electric potential','Capacitance','Dielectrics','Energy stored in capacitors']),
    (7,'Magnetic Field',array['Magnetic fields','Force on a moving charge','Force on a current carrying conductor','Motion of charged particles in magnetic fields','Electromagnetic induction','Faraday and Lenz laws']),
    (8,'Current Electricity',array['Electric current and potential difference','Resistance and resistivity','Circuit laws','Kirchhoff laws','Electrical energy and power','Cells and internal resistance','Measuring instruments']),
    (9,'Electronics',array['Semiconductors','p-n junction','Diodes and rectification','Transistors','Transistor amplification','Digital electronics','Logic gates and applications']),
    (10,'Mechanical Properties of Matter',array['Elasticity','Stress and strain','Young modulus','Viscosity','Fluid flow','Surface tension','Stokes law and terminal velocity']),
    (11,'Matter and Radiation',array['Black body radiation','Photoelectric effect','Wave-particle duality','X-rays','Radioactivity','Nuclear structure','Mass defect and binding energy','Nuclear fission and fusion','Nuclear energy and radiation safety'])
  ) as x(position,title,topics)
  loop
    insert into public.syllabus_units(subject_id,syllabus_version_id,title,position) values(v_subject,v_version,item.title,item.position) on conflict do nothing returning id into v_unit;
    if v_unit is null then select id into v_unit from public.syllabus_units where subject_id=v_subject and syllabus_version_id=v_version and position=item.position; end if;
    for topic_item in select row_number() over () as position, t.title from unnest(item.topics) as t(title)
    loop insert into public.syllabus_topics(unit_id,title,position) values(v_unit,topic_item.title,topic_item.position) on conflict do nothing; end loop;
  end loop;
end $$;
