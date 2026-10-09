# Domain name localization

`domain-localization.json` is an explicit name dictionary used for crops, market yards, and administrative locations. The resolver does exact normalized lookup and reviewed aliases only. If a Gujarati or Hindi name is unavailable, it preserves the database spelling; it must not guess a local name by translating or transliterating the English text.

## Source references

- The [Commission for Scientific and Technical Terminology agriculture glossary](https://www.shabd.education.gov.in/lexicon.jsp?lexicon=cstt_fund_Agriculture_EngHinGuj_glossary) is an official English–Hindi–Gujarati terminology reference. It is a reference for agricultural vocabulary, not a complete market-feed mapping.
- [APMC Vadodara's product list](https://www.apmcbaroda.org/sayajipura_product.php) publishes English/Gujarati crop and produce names. It is useful for common produce terms; individual entries should still be checked because the page contains inconsistent wording.
- The [Amreli District Government Gujarati taluka page](https://amreli.nic.in/gu/%E0%AA%A4%E0%AA%BE%E0%AA%B2%E0%AB%81%E0%AA%95%E0%AA%BE/) publishes local Gujarati forms for its talukas. The [Anand District Government Gujarati page](https://anand.nic.in/gu/%E0%AA%97%E0%AA%BE%E0%AA%AE-%E0%AA%85%E0%AA%A8%E0%AB%87-%E0%AA%AA%E0%AA%82%E0%AA%9A%E0%AA%BE%E0%AA%AF%E0%AA%A4%E0%AB%8B/) confirms the local taluka names, but only publishes village counts.
- Gujarati village spellings for parts of the existing Anand City and Meghraj subset were cross-checked against [Anand City](https://gujaratmap.com/anand-city/) and [Meghraj](https://gujaratmap.com/meghraj/). GujaratMap is a third-party source, not a government authority, and its spellings can conflict with other directories. These mappings are not fully approved; where sources disagree, preserve the database spelling until a local authority or fluent reviewer confirms it.
- The [Ministry of Panchayati Raj LGD page](https://panchayat.gov.in/en/lgd/) describes the official directory and location codes. The local database schema currently stores only English `name` fields for State, District, Taluka, and Village; it has no native-language fields.

## Adding a mapping

1. Search for the exact place or commodity in an authoritative local-language source. For place names, confirm the district/taluka context so a same-spelled village is not confused with another one.
2. Add the exact Gujarati/Hindi spelling and record the source in the review or change description. Do not infer a spelling from pronunciation, machine translation, or another place with a similar name.
3. Keep canonical English database values unchanged. Add a narrowly scoped alias only when a source confirms the alias refers to the same entity.
4. Re-run the localization inventory audit. Unmapped values should remain visible as untranslated in the report until they have a source-backed mapping.

## Coverage limit

The saved database inventory is a snapshot, not a live database connection. It contains 15,133 distinct village spellings: the current resolver has catalog output for 236, while 14,897 remain in their database spelling. Catalog output means a mapping exists; it does not mean every spelling has been approved by a local authority or fluent reviewer. The Ministry's LGD provides authoritative identifiers and hierarchy, but this application's database stores no native-language location fields. Complete, reliable Gujarati and Hindi coverage requires an authoritative local-name dataset or reviewed spellings for each remaining locality; the resolver intentionally leaves unsupported names in their original spelling.
