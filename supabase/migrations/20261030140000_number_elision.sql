-- Numbers join "na" to a following vowel as n', as written Kinyarwanda does
-- (makumyabiri n'icyenda). Only rows still holding the old draft change, so admin edits stay.

update public.number_phrases as n set text = v.new_text
from (values
  ('0b4763d4-426c-5860-a1f8-6bd5c085959e'::uuid, 'cumi na umunani', 'cumi n''umunani'),
  ('34d435b5-de46-51a2-963d-953da3b4df18'::uuid, 'cumi na icyenda', 'cumi n''icyenda'),
  ('2b9b7a0f-38aa-582c-bb4f-beb593d3471b'::uuid, 'makumyabiri na umunani', 'makumyabiri n''umunani'),
  ('a9468af4-dd26-56d9-97b3-da35aa69943d'::uuid, 'makumyabiri na icyenda', 'makumyabiri n''icyenda'),
  ('45c4e427-60c2-53ef-8c95-de0350b0fdaa'::uuid, 'mirongo itatu na umunani', 'mirongo itatu n''umunani'),
  ('3f45829f-ba01-5aa5-b92f-a51ecde4c782'::uuid, 'mirongo itatu na icyenda', 'mirongo itatu n''icyenda'),
  ('d0fe00e1-48ee-5258-941c-561884658266'::uuid, 'mirongo ine na umunani', 'mirongo ine n''umunani'),
  ('0e766a4d-ab83-556e-bf7c-1808c73605e7'::uuid, 'mirongo ine na icyenda', 'mirongo ine n''icyenda'),
  ('dd105338-488e-5d95-91b0-346a792af7fc'::uuid, 'mirongo itanu na umunani', 'mirongo itanu n''umunani'),
  ('89f47c70-a9bf-561f-8370-05da1bef6fc5'::uuid, 'mirongo itanu na icyenda', 'mirongo itanu n''icyenda'),
  ('e300645f-259c-5de0-ae0d-07976985ad47'::uuid, 'mirongo itandatu na umunani', 'mirongo itandatu n''umunani'),
  ('4022b48d-b197-5b2a-bb18-825dfa29109a'::uuid, 'mirongo itandatu na icyenda', 'mirongo itandatu n''icyenda'),
  ('ded21c56-f846-5f10-bb26-d3f3efc86741'::uuid, 'mirongo irindwi na umunani', 'mirongo irindwi n''umunani'),
  ('71482a0b-55c4-5a93-a315-54e4624f785c'::uuid, 'mirongo irindwi na icyenda', 'mirongo irindwi n''icyenda'),
  ('7a8caf58-4163-5481-87a3-535f8cc50009'::uuid, 'mirongo inani na umunani', 'mirongo inani n''umunani'),
  ('e723816b-4c30-5060-b4ae-bf03ee0c60a0'::uuid, 'mirongo inani na icyenda', 'mirongo inani n''icyenda'),
  ('2dd4631c-82ad-5c1c-b5e2-97507e3e38fb'::uuid, 'mirongo icyenda na umunani', 'mirongo icyenda n''umunani'),
  ('9c58fb76-21f7-5f60-8ebf-f03516978055'::uuid, 'mirongo icyenda na icyenda', 'mirongo icyenda n''icyenda'),
  ('862f052e-c319-5307-89b6-e9c78113e892'::uuid, 'ijana na mirongo itandatu na icyenda', 'ijana na mirongo itandatu n''icyenda'),
  ('06333a66-8590-5be4-ad9b-4f9851e46627'::uuid, 'ijana na mirongo irindwi na icyenda', 'ijana na mirongo irindwi n''icyenda'),
  ('4285ccc6-d7b7-51c1-9fc8-28b548789229'::uuid, 'magana ane na umunani', 'magana ane n''umunani'),
  ('5931065a-d816-537d-94b1-9415f4bac70c'::uuid, 'magana ane na cumi na icyenda', 'magana ane na cumi n''icyenda'),
  ('b8938ce9-7ef5-54da-8ae2-fd2922ae0458'::uuid, 'magana ane na mirongo itanu na icyenda', 'magana ane na mirongo itanu n''icyenda'),
  ('054ba475-b3a2-54ec-8e61-f37162edc0ba'::uuid, 'magana arindwi na mirongo ine na icyenda', 'magana arindwi na mirongo ine n''icyenda'),
  ('c9ef9e5d-f9df-56e8-8939-826b51d1e888'::uuid, 'magana cyenda na cumi na umunani', 'magana cyenda na cumi n''umunani'),
  ('76bbc0de-134e-57be-a748-7e4e261d9c62'::uuid, 'zeru, karindwi, kabiri, icyenda, makumyabiri na icyenda, zeru, gatanu, makumyabiri na gatatu', 'zeru, karindwi, kabiri, icyenda, makumyabiri n''icyenda, zeru, gatanu, makumyabiri na gatatu'),
  ('5fd7eb2c-8a1b-510a-85e5-995f0dfb5d7c'::uuid, 'zeru, karindwi, kabiri, magana arindwi na mirongo itandatu na icyenda, mirongo ine na gatatu, zeru, gatatu', 'zeru, karindwi, kabiri, magana arindwi na mirongo itandatu n''icyenda, mirongo ine na gatatu, zeru, gatatu'),
  ('b6ac5e8f-9905-5d9b-ba46-19d5146b4457'::uuid, 'zeru, karindwi, kabiri, mirongo itatu, mirongo icyenda na kabiri, magana atanu na icyenda', 'zeru, karindwi, kabiri, mirongo itatu, mirongo icyenda na kabiri, magana atanu n''icyenda'),
  ('4aff907a-b0da-5075-8ecb-1cdbda59a3d3'::uuid, 'zeru, karindwi, kabiri, karindwi, makumyabiri na icyenda, mirongo ine na karindwi, mirongo inani na gatanu', 'zeru, karindwi, kabiri, karindwi, makumyabiri n''icyenda, mirongo ine na karindwi, mirongo inani na gatanu'),
  ('156d74e4-312e-50cd-a97f-12303e7bdd4c'::uuid, 'zeru, karindwi, kabiri, magana atatu na mirongo ine na gatatu, makumyabiri na icyenda, mirongo itandatu na rimwe', 'zeru, karindwi, kabiri, magana atatu na mirongo ine na gatatu, makumyabiri n''icyenda, mirongo itandatu na rimwe'),
  ('98032168-e150-577e-babe-56b7c718407e'::uuid, 'zeru, karindwi, kabiri, gatatu, mirongo itandatu na icyenda, zeru, icyenda, mirongo ine na gatanu', 'zeru, karindwi, kabiri, gatatu, mirongo itandatu n''icyenda, zeru, icyenda, mirongo ine na gatanu'),
  ('dfcde8a5-250a-59f5-b744-3030b8ff49ac'::uuid, 'zeru, karindwi, kabiri, icyenda, mirongo inani na icyenda, mirongo itandatu na icyenda, zeru, gatatu', 'zeru, karindwi, kabiri, icyenda, mirongo inani n''icyenda, mirongo itandatu n''icyenda, zeru, gatatu'),
  ('4389b46c-a546-57ab-93fa-198d3b272a80'::uuid, 'zeru, karindwi, kabiri, magana cyenda na rimwe, mirongo inani na icyenda, mirongo itandatu na icyenda', 'zeru, karindwi, kabiri, magana cyenda na rimwe, mirongo inani n''icyenda, mirongo itandatu n''icyenda'),
  ('0ed717b9-25ec-590e-a082-1a2ac4a1e02e'::uuid, 'zeru, karindwi, kabiri, karindwi, makumyabiri na rimwe, mirongo itandatu na gatanu, mirongo itandatu na icyenda', 'zeru, karindwi, kabiri, karindwi, makumyabiri na rimwe, mirongo itandatu na gatanu, mirongo itandatu n''icyenda'),
  ('c583fca6-5c92-54c5-8620-14d3122b0310'::uuid, 'zeru, karindwi, kabiri, magana atatu na mirongo ine na icyenda, mirongo itandatu na icyenda, makumyabiri na karindwi', 'zeru, karindwi, kabiri, magana atatu na mirongo ine n''icyenda, mirongo itandatu n''icyenda, makumyabiri na karindwi'),
  ('d38df24e-698b-57e8-9029-24cd769f3b5c'::uuid, 'zeru, karindwi, kabiri, mirongo irindwi na umunani, mirongo itatu na gatandatu, magana atanu na mirongo ine na karindwi', 'zeru, karindwi, kabiri, mirongo irindwi n''umunani, mirongo itatu na gatandatu, magana atanu na mirongo ine na karindwi')
) as v (id, old_text, new_text)
where n.id = v.id and n.text = v.old_text;
