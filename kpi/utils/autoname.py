import re
import string
import random
import json


def _increment(name):
    return name + '_0'


def _rand_id(n):
    return ''.join(random.choice(string.ascii_uppercase + string.digits)
                   for _ in range(n))


def autoname_fields__depr(surv_contents, default_language=None):
    '''
    if any names are not set, automatically fill them in
    '''
    kuid_names = {}
    for surv_row in surv_contents:
        # xls2json_backends.csv_to_dict(), called by dkobo, omits 'name' keys
        # whose values are blank. Since we read JSON from the form builder
        # instead of CSV, however, we have to tolerate not only missing names
        # but blank ones as well.
        if 'name' not in surv_row or surv_row['name'] == '':
            if isinstance(surv_row['type'], dict):
                raise TypeError('Cannot autoname question of type: {}'.format(surv_row['type']))
            if re.search(r'^end[\s_]', surv_row['type']):
                continue
            if 'label' in surv_row:
                next_name = sluggify_valid_xml__depr(surv_row['label'])
            elif default_language is not None:
                _default_lang_label = surv_row['label::%s' % default_language]
                next_name = sluggify_valid_xml__depr(_default_lang_label)
            else:
                raise ValueError('Label cannot be translated: %s' %
                                 json.dumps(surv_row))
            while next_name in kuid_names.values():
                next_name = _increment(next_name)
            if 'kuid' not in surv_row:
                surv_row['kuid'] = _rand_id(8)
            if surv_row['kuid'] in kuid_names:
                raise Exception("Duplicate kuid: %s" % surv_row['kuid'])
            surv_row['name'] = next_name
            kuid_names[surv_row['kuid']] = next_name
    # kuid is unused, and can't be compared with replacement method
    for surv_row in surv_contents:
        if 'kuid' in surv_row:
            del surv_row['kuid']
    return surv_contents


def sluggify_valid_xml__depr(name):
    out = re.sub('\W+', '_', name.strip().lower())
    if re.match(r'^\d', out):
        out = '_'+out
    return out


def autovalue_choices__depr(surv_choices):
    for choice in surv_choices:
        if 'name' not in choice:
            choice['name'] = choice['label']
        # workaround for incorrect "list_name" column header (was missing _)
        if 'list name' in choice:
            choice['list_name'] = choice['list name']
            del choice['list name']
    return surv_choices